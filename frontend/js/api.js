import { WebService } from "./config"

export async function addFeature(feature, fileName) {
    const res = await fetch(WebService.url + 'add-feature/' + fileName, {
        method: 'POST',
        body: feature,
        headers: {
            'Content-Type': 'application/json'
        }
    })
    return await res.json();
}

export async function editFeature(feature, fileName, featureId) {
    const url = `${WebService.url}edit-feature/${fileName}/${featureId}`;
    const res = await fetch(url, {
        method: 'PUT',
        body: feature,
        headers: {
            'Content-Type': 'application/json'
        }
    })
    return await res.json();
}

export async function deleteFeature(featureId, fileName) {
    const url = `${WebService.url}delete-feature/${fileName}/${featureId}`;
    const res = await fetch(url, {
        method: 'DELETE',
    })
    return await res.json();
}