module jszip {

    /**
     * sheet 图集的数据类型
     */
    export interface SheetDataByType {
        file: string,
        frames: {
            [key: string]: SheetSpriteDataByType
        }
    }
    /**
     * 生成龙骨时传入参数
     */
    export interface dragonBonesDataByType {
        armatureName: string,
        animationName?: string,
        playTimes?: number
    }

    /**
     * sheet 图集内的子 texture 数据类型
     */
    interface SheetSpriteDataByType {
        x: number,
        y: number,
        w: number,
        h: number,
        offX: number,
        offY: number,
        sourceW: number,
        sourceH: number
    }

}