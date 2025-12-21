
import os
import json
from flask import Flask, jsonify, send_file, request
from flask_cors import CORS
import geopandas as gpd
import pandas as pd
from shapely.geometry import Point, LineString, Polygon
from pathlib import Path

app = Flask(__name__)
CORS(app)  # 启用跨域支持

# 配置Shapefile存储目录
SHP_DIRECTORY = "backend/data"
os.makedirs(SHP_DIRECTORY, exist_ok=True)

def find_shapefile(base_path):
    """查找与基础名称匹配的.shp文件"""
    base_name = Path(base_path).stem
    shp_files = list(Path(SHP_DIRECTORY).glob(f"{base_name}*.shp"))
    if shp_files:
        return str(shp_files[0])
    # 如果没有精确匹配，尝试模糊匹配
    all_shp = list(Path(SHP_DIRECTORY).glob("*.shp"))
    return str(all_shp[0]) if all_shp else None

@app.route('/')
def index():
    """服务状态检查"""
    return jsonify({
        "status": "running",
        "service": "SHP to GeoJSON converter for OpenLayers",
        "endpoints": {
            "/data/<filename>": "Convert SHP file to GeoJSON",
            "/list-shapefiles": "List available shapefiles",
            "/health": "Health check"
        }
    })

@app.route('/health')
def health_check():
    """健康检查端点"""
    return jsonify({"status": "healthy"})

@app.route('/list-shapefiles')
def list_shapefiles():
    """列出所有可用的Shapefile文件"""
    try:
        shp_files = []
        for file_path in Path(SHP_DIRECTORY).glob("*.shp"):
            # 获取关联文件信息
            base_name = file_path.stem
            associated_files = list(Path(SHP_DIRECTORY).glob(f"{base_name}.*"))
            shp_files.append({
                "name": base_name,
                "path": str(file_path),
                "file_count": len(associated_files),
                "size": sum(f.stat().st_size for f in associated_files)
            })
        return jsonify({"shapefiles": shp_files})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def get_shapefile_path(filename):
    """获取SHP文件完整路径"""
    return os.path.join(SHP_DIRECTORY, f"{filename}.shp")

@app.route('/data/<filename>')
def shp_to_geojson(filename):
    """将指定的Shapefile转换为GeoJSON格式"""
    try:
        # 构建文件路径
        shp_path = os.path.join(SHP_DIRECTORY, f"{filename}.shp")
        
        # 如果直接路径不存在，尝试查找匹配文件
        if not os.path.exists(shp_path):
            shp_path = find_shapefile(os.path.join(SHP_DIRECTORY, filename))
            if not shp_path or not os.path.exists(shp_path):
                return jsonify({"error": f"Shapefile '{filename}' not found"}), 404

        # 读取Shapefile
        gdf = gpd.read_file(shp_path)
        
        # 处理坐标系转换(确保输出为WGS84)
        if gdf.crs and gdf.crs.to_string() != 'EPSG:4326':
            gdf = gdf.to_crs('EPSG:4326')
        
        # 转换为GeoJSON字符串
        geojson_str = gdf.to_json()
        geojson_data = json.loads(geojson_str)
        
        # 添加额外的元数据
        response_data = {
            "type": "FeatureCollection",
            "features": geojson_data["features"],
            "metadata": {
                "source": filename,
                "feature_count": len(geojson_data["features"]),
                "crs": "EPSG:4326",
                "bounds": gdf.total_bounds.tolist() if hasattr(gdf, 'total_bounds') else []
            }
        }
        
        return jsonify(response_data)
        
    except FileNotFoundError:
        return jsonify({"error": f"Shapefile '{filename}' not found"}), 404
    except Exception as e:
        return jsonify({"error": f"Conversion failed: {str(e)}"}), 500

@app.route('/data/<filename>/download')
def download_geojson(filename):
    """下载GeoJSON文件"""
    try:
        # 构建文件路径
        shp_path = os.path.join(SHP_DIRECTORY, f"{filename}.shp")
        
        # 如果直接路径不存在，尝试查找匹配文件
        if not os.path.exists(shp_path):
            shp_path = find_shapefile(os.path.join(SHP_DIRECTORY, filename))
            if not shp_path or not os.path.exists(shp_path):
                return jsonify({"error": f"Shapefile '{filename}' not found"}), 404

        # 读取Shapefile
        gdf = gpd.read_file(shp_path)
        
        # 处理坐标系转换(确保输出为WGS84)
        if gdf.crs and gdf.crs.to_string() != 'EPSG:4326':
            gdf = gdf.to_crs('EPSG:4326')
        
        # 创建临时GeoJSON文件
        temp_file = f"/tmp/{filename}.geojson"
        gdf.to_file(temp_file, driver='GeoJSON', encoding='utf-8')
        
        return send_file(
            temp_file,
            as_attachment=True,
            download_name=f"{filename}.geojson",
            mimetype='application/geo+json'
        )
        
    except FileNotFoundError:
        return jsonify({"error": f"Shapefile '{filename}' not found"}), 404
    except Exception as e:
        return jsonify({"error": f"Download failed: {str(e)}"}), 500


@app.route('/add-feature/<filename>', methods=['POST'])
def add_feature(filename):
    """向SHP文件添加新要素"""
    try:
        data = request.get_json()
        geometry_data = data.get('geometry')
        properties = data.get('properties', {})
        
        if not geometry_data:
            return jsonify({"error": "几何数据不能为空"}), 400
            
        shp_path = get_shapefile_path(filename)
        if not os.path.exists(shp_path):
            return jsonify({"error": f"文件 {filename} 不存在"}), 404
            
        # 读取现有SHP文件
        gdf = gpd.read_file(shp_path)
        
        # 设置默认坐标系（如果Shapefile没有定义）
        if gdf.crs is None:
            gdf.crs = 'EPSG:4326'
        
        # 创建几何对象
        geom_type = geometry_data.get('type')
        coordinates = geometry_data.get('coordinates')
        
        if geom_type == 'Point':
            geometry = Point(coordinates)
        elif geom_type == 'LineString':
            geometry = LineString(coordinates)
        elif geom_type == 'Polygon':
            geometry = Polygon(coordinates[0])  # 外环
        else:
            return jsonify({"error": "不支持的几何类型"}), 400
            
        # 创建新要素
        new_feature = gpd.GeoDataFrame([properties], geometry=[geometry], crs='EPSG:3857')
        
        # 转换坐标（如果需要）  
        if new_feature.crs != gdf.crs:
            new_feature = new_feature.to_crs(gdf.crs)
        
        # 确保新要素的数据类型与原数据一致
        for col in gdf.columns:
            if col == 'geometry':
                continue  # 跳过geometry列
            if col in new_feature.columns:
                # 获取原数据的列类型
                original_dtype = gdf[col].dtype
                
                # 尝试转换新要素的列类型
                try:
                    new_feature[col] = new_feature[col].astype(original_dtype)
                except (ValueError, TypeError):
                    # 如果转换失败，保持原有值但记录警告
                    app.logger.warning(f"无法将列 {col} 转换为类型 {original_dtype}")
        
        # 合并到现有数据
        gdf = pd.concat([gdf, new_feature], ignore_index=True)
        
        # 保存更新后的文件
        gdf.to_file(shp_path, encoding='utf-8')
        
        return jsonify({
            "success": True,
            "message": "要素添加成功",
            "feature_id": len(gdf) - 1
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/edit-feature/<filename>/<int:fid>', methods=['PUT'])
def edit_feature(filename, fid):
    """编辑SHP文件中的指定要素"""
    try:
        data = request.get_json()
        geometry_data = data.get('geometry')
        properties = data.get('properties')
        
        shp_path = get_shapefile_path(filename)
        if not os.path.exists(shp_path):
            return jsonify({"error": f"文件 {filename} 不存在"}), 404
            
        # 读取SHP文件
        gdf = gpd.read_file(shp_path)
        
        # 设置默认坐标系（如果Shapefile没有定义）
        if gdf.crs is None:
            gdf.crs = 'EPSG:4326'
        
        if fid >= len(gdf):
            return jsonify({"error": "要素ID不存在"}), 404
            
        # 更新几何（如果有提供）
        if geometry_data:
            geom_type = geometry_data.get('type')
            coordinates = geometry_data.get('coordinates')
            
            # 创建临时GeoDataFrame进行坐标转换
            if geom_type == 'Point':
                temp_geom = gpd.GeoDataFrame([{}], geometry=[Point(coordinates)], crs='EPSG:3857')
            elif geom_type == 'LineString':
                temp_geom = gpd.GeoDataFrame([{}], geometry=[LineString(coordinates)], crs='EPSG:3857')
            elif geom_type == 'Polygon':
                temp_geom = gpd.GeoDataFrame([{}], geometry=[Polygon(coordinates[0])], crs='EPSG:3857')
            else:
                return jsonify({"error": "不支持的几何类型"}), 400
            
            # 转换坐标（如果需要）
            if temp_geom.crs != gdf.crs:
                temp_geom = temp_geom.to_crs(gdf.crs)
                
            gdf.loc[fid, 'geometry'] = temp_geom.geometry.iloc[0]
                
        # 更新属性（如果有提供）
        new_feature = gpd.GeoDataFrame([properties], geometry=[gdf.loc[fid, 'geometry']], crs=gdf.crs)
        # 确保数据类型与原数据一致
        for col in new_feature.columns:
            if col == 'geometry':
                continue  # 跳过geometry列
            if col in gdf.columns:
                # 获取原数据的列类型
                original_dtype = gdf[col].dtype
                
                # 尝试转换新要素的列类型
                try:
                    gdf.loc[fid, col] = new_feature[col].astype(original_dtype).values[0]
                except (ValueError, TypeError):
                    # 如果转换失败，保持原有值但记录警告
                    app.logger.warning(f"无法将列 {col} 转换为类型 {original_dtype}")
                    
        # 保存更新后的文件
        gdf.to_file(shp_path, encoding='utf-8')
        
        return jsonify({
            "success": True,
            "message": f"要素 {fid} 更新成功"
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/delete-feature/<filename>/<int:fid>', methods=['DELETE'])
def delete_feature(filename, fid):
    """删除SHP文件中的指定要素"""
    try:
        shp_path = get_shapefile_path(filename)
        if not os.path.exists(shp_path):
            return jsonify({"error": f"文件 {filename} 不存在"}), 404
            
        # 读取SHP文件
        gdf = gpd.read_file(shp_path)
        
        if fid >= len(gdf):
            return jsonify({"error": "要素ID不存在"}), 404
            
        # 删除指定要素
        gdf = gdf.drop(fid).reset_index(drop=True)
        
        # 保存更新后的文件
        gdf.to_file(shp_path, encoding='utf-8')
        
        return jsonify({
            "success": True,
            "message": f"要素 {fid} 删除成功"
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500



if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
