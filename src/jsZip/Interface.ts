module jszip {

    /**
     * 生成龙骨时传入参数
     */
    export interface DataType_dragonBone {
        /**骨架数据名 */
        armatureName: string,
        /**动画数据名 */
        animationName?: string,
        /**循环次数，默认 -1。(-1：使用动画数据默认值，0：无限循环播放，[1~N]：循环播放 N 次) */
        playTimes?: number,
        /**动画开始播放时执行 */
        startPlayHandler?: Function,
        /**动画播放完成后执行 */
        completeHandler?: Function,
        /**动画每循环播放完一次执行 */
        completeLoopHandler?: Function
    }

    /**
     * 生成帧动画时传入参数
     */
    export interface DataType_movieClip {
        /**动作名称 */
        actionName: string,
        /**指定帧的帧号或帧标签。默认`0` */
        startFrame?: string | number,
        /**播放次数，参数为整数。可选参数：`>=1`：设定播放次数，`<0`：循环播放，默认`0`：不改变播放次数 */
        playTimes?: number,
        /**触发帧动画事件时执行 */
        frameLabelHandler?: Function,
        /**动画播放完成后执行 */
        completeHandler?: Function,
        /**动画每循环播放完一次执行 */
        completeLoopHandler?: Function
    }

    /**
     * sheet 图集的数据类型
     */
    export interface DataType_sheet {
        /**对应`png`文件名 */
        file: string,
        /**切图数据 */
        frames: {
            [key: string]: DataType_sheetSprite
        }
    }

    /**
     * sheet 图集内的子 texture 数据类型
     */
    interface DataType_sheetSprite {
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