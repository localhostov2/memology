import {
    $ws,
    connectWs,
    disconnectWs,
    WebsocketClient,
    WebsocketServer,
} from "@shared"
import { TSendFunction } from "@types"
import { useParams } from "@vkontakte/vk-mini-apps-router"
import { useUnit } from "effector-react"
import { useEffect } from "react"

export function useWebsocket<T extends keyof WebsocketServer>(
    game: T,
    handlers: {
        [K in keyof NonNullable<WebsocketServer[T]>]: (
            msg: NonNullable<NonNullable<WebsocketServer[T]>[K]>,
            send: TSendFunction<T>,
        ) => void
    },
    { onClose }: { onClose: () => unknown } = { onClose: console.log },
): { send: TSendFunction<T> } {
    const { roomId } = useParams<"roomId">()!
    const ws = useUnit($ws)

    const send = <C extends keyof NonNullable<WebsocketClient[T]>>(
        cmdName: C,
        data: NonNullable<NonNullable<WebsocketClient[T]>[C]>,
    ) => {
        ws?.send(
            WebsocketClient.toBinary({
                [game]: {
                    [cmdName]: data,
                },
            }),
        )
    }

    const handler = (msg: WebsocketServer) => {
        const gameData = msg[game]!
        const eventName = Object.keys(gameData)[0]! as keyof NonNullable<
            WebsocketServer[T]
        >

        const handler = handlers[eventName]
        if (!handler)
            return console.error(`Event ${String(eventName)} not implemented`)

        handler(msg[game]![eventName]!, send)
    }

    useEffect(() => {
        connectWs({ game, handler, roomId: roomId!, onClose })

        return disconnectWs
    }, [])

    return { send }
}
