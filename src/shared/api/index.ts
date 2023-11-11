import wretch from "wretch"
import QueryStringAddon from "wretch/addons/queryString"
import { UserResponse_UserItem } from "../proto"
import { MemeListResponse } from "../proto/meme"

const api = wretch("https://memology.animaru.app")
    .headers({
        //TODO: rewrite
        "vk-params": window.location.href.replace(/(.*)\?/i, ""),
    })
    .addon(QueryStringAddon)

export class API {
    static async user() {
        const buffer = await api.get("/user").arrayBuffer()

        return UserResponse_UserItem.fromBinary(new Uint8Array(buffer))
    }

    static async memesList(page: number, pageSize?: number) {
        const buffer = await api
            .query({
                page,
                pageSize,
            })
            .get("/meme/list")
            .arrayBuffer()

        return MemeListResponse.fromBinary(new Uint8Array(buffer))
    }
}
