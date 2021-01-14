namespace jszip {
    /**
     * @author ghq `create by 2021-01-09`
     */
    class MovieClipSprite extends egret.DisplayObjectContainer {

        private mcFactory: egret.MovieClipDataFactory = null;
        private mc: egret.MovieClip = null;
        private frameLabelFun: Function = null;
        private completeFun: Function = null;
        private completeLoopFun: Function = null;

        constructor() {
            super();
        }

        /**
         * 获取一个帧动画对象
         * @param _resName 资源名称
         * @param _args `DataType_movieClip`类型参数
         */
        static async create(_resName: string, _args: DataType_movieClip): Promise<MovieClipSprite> {
            const display: MovieClipSprite = new MovieClipSprite();
            await display.init(_resName, _args.frameLabelHandler, _args.completeLoopHandler, _args.completeHandler);
            display.play(_args.actionName, _args.startFrame, _args.playTimes);
            return display;
        }

        /**
         * 创建一个帧动画
         * @param _resName 资源名
         * @param _frameLabelHandler 触发帧动画事件时执行
         * @param _completeFun 动画播放完成后执行
         * @param _completeLoopFun 动画每循环播放完一次执行
         */
        private async init(_resName: string, _frameLabelHandler: Function, _completeFun?: Function, _completeLoopFun?: Function) {
            this.touchEnabled = true;
            const movieClipData = await coreCodeLib.getRes(`${_resName}_json`);
            const texture = await coreCodeLib.getRes(`${_resName}_png`);
            if (!movieClipData || !texture) {
                return;
            }

            this.mcFactory = new egret.MovieClipDataFactory(movieClipData, texture);
            this.mc = new egret.MovieClip();
            this.addChild(this.mc);

            this.addEventListener(egret.Event.REMOVED_FROM_STAGE, this.destoryClip, this);
            if (_frameLabelHandler) {
                this.frameLabelFun = _frameLabelHandler;
                this.mc.addEventListener(egret.MovieClipEvent.FRAME_LABEL, this.frameLabelFun, this);
            }
            if (_completeFun) {
                this.completeFun = _completeFun;
                this.mc.addEventListener(egret.Event.COMPLETE, this.completeFun, this);
            }
            if (_completeLoopFun) {
                this.completeLoopFun = _completeLoopFun;
                this.mc.addEventListener(egret.Event.LOOP_COMPLETE, this.completeLoopFun, this);
            }
        }

        /**
         * 播放动画
         * @param _actionName 动作名称
         * @param _startFrame 指定帧的帧号或帧标签。默认`0`
         * @param _playTimes 播放次数，参数为整数。可选参数：`>=1`：设定播放次数，`<0`：循环播放，默认`0`：不改变播放次数
         */
        play(_actionName: string = "", _startFrame: string | number = 0, _playTimes: number = 0) {
            if (!this.mc) {
                return;
            }
            if (_actionName) {
                this.mc.movieClipData = this.mcFactory.generateMovieClipData(_actionName);
                this.mc.gotoAndPlay(_startFrame, _playTimes);
            } else {
                this.mc.play();
            }
        }

        /**
         * 暂停动画，如需恢复则调用 `play()` 不传参数即可
         */
        stop() {
            this.mc.stop();
        }

        /**帧频 */
        public get frameRate(): number {
            return this.mc.frameRate;
        }
        public set frameRate(v: number) {
            this.mc.frameRate = v;
        }


        private destoryClip() {
            this.removeEventListener(egret.Event.REMOVED_FROM_STAGE, this.destoryClip, this);
            this.mc.removeEventListener(egret.MovieClipEvent.FRAME_LABEL, this.frameLabelFun, this);
            this.mc.removeEventListener(egret.Event.COMPLETE, this.completeFun, this);
            this.mc.removeEventListener(egret.Event.LOOP_COMPLETE, this.completeLoopFun, this);

            this.removeChild(this.mc);
            this.mc = null;
        }
    }

    export const movieClipSprite = MovieClipSprite.create;
}