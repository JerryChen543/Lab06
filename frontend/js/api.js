import { WebService } from "./config"

export async function addFeature(feature, fileName) {
    const res = await fetch(WebService.url + 'add-feature/' + fileName, {
        method: 'POST',
        body: feature,
        headers: {
            'Content-Type': 'application/json'
        }
    })
    console.log(await res.json());
}