namespace jszip {
	/**
	 * @author ghq `create by 2021-01-09`
	 */
	class DragonBoneSprite extends egret.DisplayObjectContainer {
		/**实例ID*/
		private static disNameIndex: number = 0;
		/**骨架对象*/
		private armatureDisplay: dragonBones.EgretArmatureDisplay = null;
		/**骨架实例数据名称*/
		private disName: string = "";
		private startPlayFun: Function = null;
		private completeFun: Function = null;
		private completeLoopFun: Function = null;
		/**资源名*/
		public resName: string = "";
		/**当前播放的动作名*/
		public curAniName: string = "";
		/**动画循环次数*/
		public playTimes: number = -1;

		constructor() {
			super();
		}

		/**
		 * 获取一个龙骨对象
		 * @param _resName 资源名称
		 * @param _args `DataType_dragonBone`类型参数
		 */
		static async create(_resName: string, _args: DataType_dragonBone): Promise<DragonBoneSprite> {
			const display: DragonBoneSprite = new DragonBoneSprite();
			await display.init(_resName, _args.armatureName, _args.startPlayHandler, _args.completeHandler, _args.completeLoopHandler);
			display.play(_args.animationName, _args.playTimes);
			return display;
		}

		/**
		 * 创建一个骨架
		 * @param _resName 资源名
		 * @param _armatureName 骨架数据名称
		 * @param _startPlayFun 动画开始播放时执行
		 * @param _completeFun 动画播放完成后执行
		 * @param _completeLoopFun 动画每循环播放完一次执行
		 */
		private async init(_resName: string, _armatureName: string, _startPlayFun?: Function, _completeFun?: Function, _completeLoopFun?: Function) {
			this.touchEnabled = true;
			const factory = dragonBones.EgretFactory.factory;

			const dragonbonesData = await coreCodeLib.getRes(`${_resName}_ske_json`);
			const textureData = await coreCodeLib.getRes(`${_resName}_tex_json`);
			const texture = await coreCodeLib.getRes(`${_resName}_tex_png`);
			if (!dragonbonesData || !textureData || !texture) {
				return;
			}

			this.resName = _resName;
			this.disName = dragonbonesData.name + "_" + DragonBoneSprite.disNameIndex++;
			factory.parseDragonBonesData(dragonbonesData, this.disName);
			factory.parseTextureAtlasData(textureData, texture, this.disName);

			this.armatureDisplay = factory.buildArmatureDisplay(_armatureName, this.disName);
			this.addChild(this.armatureDisplay);

			this.addEventListener(egret.Event.REMOVED_FROM_STAGE, this.destoryBone, this);
			if (_startPlayFun) {
				this.startPlayFun = _startPlayFun;
				this.armatureDisplay.addEventListener(dragonBones.EventObject.START, this.startPlayFun, this);
			}
			if (_completeFun) {
				this.completeFun = _completeFun;
				this.armatureDisplay.addEventListener(dragonBones.EventObject.COMPLETE, this.completeBeforeHandler, this);
			}
			if (_completeLoopFun) {
				this.completeLoopFun = _completeLoopFun;
				this.armatureDisplay.addEventListener(dragonBones.EventObject.LOOP_COMPLETE, this.completeLoopBeforeHandler, this);
			}
		}

		/**
		 * 播放动画
		 * @param _animationName 动画数据名
		 * @param _playTimes 循环次数，默认 -1。(-1：使用动画数据默认值，0：无限循环播放，[1~N]：循环播放 N 次)
		 */
		public play(_animationName: string = null, _playTimes: number = -1) {
			if (this.armatureDisplay == null || this.curAniName == _animationName) {
				return;
			}
			if (_animationName != null) this.curAniName = _animationName;
			if (_playTimes != -1) this.playTimes = _playTimes;
			if (this.armatureDisplay && this.armatureDisplay.animation.hasAnimation(this.curAniName)) {
				this.armatureDisplay.animation.play(this.curAniName, this.playTimes);
			}
		}

		/**
		 * 暂停动画，如需恢复则调用 `play()` 不传参数即可
		 */
		public stop() {
			if (this.armatureDisplay == null) {
				return;
			}
			this.armatureDisplay.animation.stop();
		}

		/**
		 * 动画播放完成后执行(预处理)
		 */
		private completeBeforeHandler(e: egret.Event) {
			// 播放完成重置数据
			this.curAniName = "";
			this.playTimes = -1;

			this.completeFun(e);
		}

		/**
		 * 动画每循环播放完一次执行(预处理)
		 */
		private completeLoopBeforeHandler(e: egret.Event) {
			// 可以使用`playTimes`来判断当前还剩几次循环
			if (this.playTimes > 0) {
				this.playTimes--;
			}

			this.completeLoopFun(e);
		}

		private destoryBone() {
			this.removeEventListener(egret.Event.REMOVED_FROM_STAGE, this.destoryBone, this);
			this.armatureDisplay.removeEventListener(dragonBones.EventObject.START, this.startPlayFun, this);
			this.armatureDisplay.removeEventListener(dragonBones.EventObject.COMPLETE, this.completeBeforeHandler, this);
			this.armatureDisplay.removeEventListener(dragonBones.EventObject.LOOP_COMPLETE, this.completeLoopBeforeHandler, this);

			this.removeChild(this.armatureDisplay);
			this.armatureDisplay.animation.stop();
			this.armatureDisplay.animation.reset();
			this.armatureDisplay.dispose();
			this.armatureDisplay = null;

			dragonBones.EgretFactory.factory.removeDragonBonesData(this.disName);
			dragonBones.EgretFactory.factory.removeTextureAtlasData(this.disName);
		}
	}

	export const dragonBoneSprite = DragonBoneSprite.create;
}