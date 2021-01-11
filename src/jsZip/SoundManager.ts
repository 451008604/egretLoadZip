namespace jszip {
    /**
     * @author ghq `create by 2021-01-12`
     */
    class SoundManager {
        private music: egret.Sound = null;
        private musicChannel: egret.SoundChannel = null;
        private effect: egret.Sound = null;
        private effectChannel: egret.SoundChannel = null;
        private postion: number = 0;
        private _musicVolume: number = 1;
        private _effectVolume: number = 1;

        constructor() {
        }

        /**
         * 创建一个背景音乐
         * @param _resName 资源名称
         * @param _starTimer 应开始播放的初始位置（以秒为单位），默认值是 0
         * @param _loops 播放次数，默认值是 0，循环播放。 大于 0 为播放次数，如 1 为播放 1 次；小于等于 0，为循环播放
         */
        public async createMusic(_resName: string, _starTimer: number = 0, _loops: number = 0) {
            this.music = await jsZipCoreCodeLib.getRes(_resName);
            this.music.type = egret.Sound.MUSIC;
            this.postion = 0;
            this.musicPlay(_starTimer, _loops);
        }

        /**
         * 播放背景音乐
         * @param _starTimer 应开始播放的初始位置（以秒为单位），默认值是 0
         * @param _loops 播放次数，默认值是 0，循环播放。 大于 0 为播放次数，如 1 为播放 1 次；小于等于 0，为循环播放
         */
        public musicPlay(_starTimer: number = this.postion, _loops: number = 0) {
            this.music && (
                this.musicChannel = this.music.play(_starTimer, _loops),
                this.musicChannel.volume = this.musicVolume
            );
        }

        /**
         * 停止背景音乐
         */
        public musicStop() {
            this.musicChannel && (
                this.postion = this.musicChannel.position,
                this.musicChannel.stop()
            );
        }

        /**
         * 背景音乐音量
         * @param _volume 音量范围从 0（静音）至 1（最大音量）
         */
        public set musicVolume(_volume: number) {
            this.musicChannel && (
                this.musicChannel.volume = _volume,
                this._musicVolume = _volume
            );
        }

        public get musicVolume() {
            return this._musicVolume;
        }

        /**
         * 创建一个音效
         * @param _resName 资源名称
         * @param _starTimer 应开始播放的初始位置（以秒为单位），默认值是 0
         * @param _loops 播放次数，默认值是 0，循环播放。 大于 0 为播放次数，如 1 为播放 1 次；小于等于 0，为循环播放
         */
        public async createEffect(_resName: string, _starTimer: number = 0, _loops: number = 1) {
            this.effect = await jsZipCoreCodeLib.getRes(_resName);
            this.effect.type = egret.Sound.EFFECT;
            this.effectChannel = this.effect.play(_starTimer, _loops);
            this.effectChannel.volume = this.effectVolume;
        }

        /**
         * 音效音量
         */
        public set effectVolume(v: number) {
            this._effectVolume = v;
        }

        public get effectVolume(): number {
            return this._effectVolume;
        }
    }

    /**声音管理器 */
    export let sound = new SoundManager();
}