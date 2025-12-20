import os
from pathlib import Path

from flask import Flask, jsonify, send_file, request
from flask_cors import CORS

import geopandas as gpd
import pandas as pd
from shapely.geometry import Point, LineString, Polygon

app = Flask(__name__)
CORS(app)

# ===============================
# 基础路径配置
# ===============================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SHP_DIRECTORY = os.path.join(BASE_DIR, "data")
os.makedirs(SHP_DIRECTORY, exist_ok=True)


# ===============================
# 工具函数
# ===============================
def find_shapefile(base_path):
    base_name = Path(base_path).stem
    shp_files = list(Path(SHP_DIRECTORY).glob(f"{base_name}*.shp"))
    if shp_files:
        return str(shp_files[0])
    all_shp = list(Path(SHP_DIRECTORY).glob("*.shp"))
    return str(all_shp[0]) if all_shp else None


def get_shapefile_path(filename):
    return os.path.join(SHP_DIRECTORY, f"{filename}.shp")


def read_shp_no_crs(shp_path):
    """统一入口：读取 SHP 并彻底移除 CRS"""
    gdf = gpd.read_file(shp_path)
    gdf = gdf.set_crs(None, allow_override=True)
    return gdf


# ===============================
# 基础接口
# ===============================
@app.route("/")
def index():
    return jsonify({
        "status": "running",
        "service": "SHP to GeoJSON backend (CRS bypass mode)",
        "endpoints": [
            "/health",
            "/list-shapefiles",
            "/shp-to-geojson/<name>",
            "/shp-to-geojson/<name>/download",
            "/add-feature/<filename>",
            "/edit-feature/<filename>/<fid>",
            "/delete-feature/<filename>/<fid>"
        ]
    })


@app.route("/health")
def health():
    return jsonify({"status": "healthy"})


@app.route("/list-shapefiles")
def list_shapefiles():
    try:
        shp_files = []
        for shp in Path(SHP_DIRECTORY).glob("*.shp"):
            base = shp.stem
            related = list(Path(SHP_DIRECTORY).glob(f"{base}.*"))
            shp_files.append({
                "name": base,
                "path": str(shp),
                "file_count": len(related),
                "size": sum(f.stat().st_size for f in related)
            })
        return jsonify({"shapefiles": shp_files})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ===============================
# SHP → GeoJSON（核心接口）
# ===============================
@app.route("/shp-to-geojson/<name>")
def shp_to_geojson(name):
    shp_path = get_shapefile_path(name)

    if not os.path.exists(shp_path):
        return jsonify({"error": f"{name}.shp not found"}), 404

    try:
        gdf = read_shp_no_crs(shp_path)
        geojson = gdf.to_json(ensure_ascii=False)

        return app.response_class(
            response=geojson,
            status=200,
            mimetype="application/json"
        )
    except Exception as e:
        return jsonify({
            "error": "Conversion failed",
            "detail": str(e)
        }), 500


# ===============================
# 下载 GeoJSON（不做 CRS 转换）
# ===============================
@app.route("/shp-to-geojson/<filename>/download")
def download_geojson(filename):
    try:
        shp_path = get_shapefile_path(filename)
        if not os.path.exists(shp_path):
            shp_path = find_shapefile(filename)
            if not shp_path:
                return jsonify({"error": "Shapefile not found"}), 404

        gdf = read_shp_no_crs(shp_path)

        temp_path = os.path.join(BASE_DIR, f"{filename}.geojson")
        gdf.to_file(temp_path, driver="GeoJSON")

        return send_file(
            temp_path,
            as_attachment=True,
            download_name=f"{filename}.geojson",
            mimetype="application/geo+json"
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ===============================
# 要素编辑相关（全部 CRS 绕过）
# ===============================
@app.route("/add-feature/<filename>", methods=["POST"])
def add_feature(filename):
    try:
        data = request.get_json()
        geometry_data = data.get("geometry")
        properties = data.get("properties", {})

        if not geometry_data:
            return jsonify({"error": "geometry is required"}), 400

        shp_path = get_shapefile_path(filename)
        if not os.path.exists(shp_path):
            return jsonify({"error": "file not found"}), 404

        gdf = read_shp_no_crs(shp_path)

        geom_type = geometry_data["type"]
        coords = geometry_data["coordinates"]

        if geom_type == "Point":
            geom = Point(coords)
        elif geom_type == "LineString":
            geom = LineString(coords)
        elif geom_type == "Polygon":
            geom = Polygon(coords[0])
        else:
            return jsonify({"error": "unsupported geometry"}), 400

        new_gdf = gpd.GeoDataFrame(
            [properties],
            geometry=[geom],
            crs=None
        )

        gdf = pd.concat([gdf, new_gdf], ignore_index=True)
        gdf.to_file(shp_path)

        return jsonify({"success": True, "feature_id": len(gdf) - 1})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/edit-feature/<filename>/<int:fid>", methods=["PUT"])
def edit_feature(filename, fid):
    try:
        data = request.get_json()
        shp_path = get_shapefile_path(filename)

        if not os.path.exists(shp_path):
            return jsonify({"error": "file not found"}), 404

        gdf = read_shp_no_crs(shp_path)

        if fid >= len(gdf):
            return jsonify({"error": "invalid feature id"}), 404

        if "geometry" in data:
            geom = data["geometry"]
            t, c = geom["type"], geom["coordinates"]
            if t == "Point":
                gdf.at[fid, "geometry"] = Point(c)
            elif t == "LineString":
                gdf.at[fid, "geometry"] = LineString(c)
            elif t == "Polygon":
                gdf.at[fid, "geometry"] = Polygon(c[0])

        if "properties" in data:
            for k, v in data["properties"].items():
                if k in gdf.columns:
                    gdf.at[fid, k] = v

        gdf.to_file(shp_path)
        return jsonify({"success": True})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/delete-feature/<filename>/<int:fid>", methods=["DELETE"])
def delete_feature(filename, fid):
    try:
        shp_path = get_shapefile_path(filename)
        if not os.path.exists(shp_path):
            return jsonify({"error": "file not found"}), 404

        gdf = read_shp_no_crs(shp_path)

        if fid >= len(gdf):
            return jsonify({"error": "invalid feature id"}), 404

        gdf = gdf.drop(fid).reset_index(drop=True)
        gdf.to_file(shp_path)

        return jsonify({"success": True})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ===============================
# 启动
# ===============================
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
