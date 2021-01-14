//////////////////////////////////////////////////////////////////////////////////////
//
//  Copyright (c) 2014-present, Egret Technology.
//  All rights reserved.
//  Redistribution and use in source and binary forms, with or without
//  modification, are permitted provided that the following conditions are met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//     * Neither the name of the Egret nor the
//       names of its contributors may be used to endorse or promote products
//       derived from this software without specific prior written permission.
//
//  THIS SOFTWARE IS PROVIDED BY EGRET AND CONTRIBUTORS "AS IS" AND ANY EXPRESS
//  OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
//  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
//  IN NO EVENT SHALL EGRET AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
//  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
//  LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;LOSS OF USE, DATA,
//  OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
//  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
//  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
//  EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
//////////////////////////////////////////////////////////////////////////////////////

class Main extends eui.UILayer {


    protected createChildren(): void {
        super.createChildren();

        egret.lifecycle.addLifecycleListener((context) => {
            // custom lifecycle plugin
        })

        egret.lifecycle.onPause = () => {
            // egret.ticker.pause();
        }

        egret.lifecycle.onResume = () => {
            // egret.ticker.resume();
        }

        //inject the custom material parser
        //注入自定义的素材解析器
        let assetAdapter = new AssetAdapter();
        egret.registerImplementation("eui.IAssetAdapter", assetAdapter);
        egret.registerImplementation("eui.IThemeAdapter", new ThemeAdapter());

        this.runGame().catch(e => {
            console.log(e);
        })
    }

    private async runGame() {

        console.time("initRes");
        await jszip.coreCodeLib.initRes();
        console.timeEnd("initRes");
        await this.loadResource();
        this.createGameScene();
        await platform.login();
        const userInfo = await platform.getUserInfo();
        console.log(userInfo);

    }

    private async loadResource() {
        try {
            const loadingView = new LoadingUI();
            this.stage.addChild(loadingView);
            await RES.loadConfig("resource/default.res.json", "resource/");
            await this.loadTheme();
            // await RES.loadGroup("preload", 0, loadingView);
            this.stage.removeChild(loadingView);
        }
        catch (e) {
            console.error(e);
        }
    }

    private async loadTheme() {
        return new Promise((resolve, reject) => {
            // load skin theme configuration file, you can manually modify the file. And replace the default skin.
            //加载皮肤主题配置文件,可以手动修改这个文件。替换默认皮肤。
            let theme = new eui.Theme("resource/default.thm.json", this.stage);
            theme.addEventListener(eui.UIEvent.COMPLETE, (e) => {
                resolve(e);
            }, this);
        })
    }

    private textfield: egret.TextField;
    /**
     * 创建场景界面
     * Create scene interface
     */
    protected async createGameScene() {
        let stageW = this.stage.stageWidth;
        let stageH = this.stage.stageHeight;
        console.time();
        let texture = await jszip.coreCodeLib.getRes("bg_jpg") as egret.Texture;
        console.timeEnd()
        let sky = new egret.Bitmap(texture);
        this.addChild(sky);
        sky.width = stageW;
        sky.height = stageH;

        let topMask = new egret.Shape();
        topMask.graphics.beginFill(0x000000, 0.5);
        topMask.graphics.drawRect(0, 0, stageW, 172);
        topMask.graphics.endFill();
        topMask.y = 33;
        this.addChild(topMask);

        texture = await jszip.coreCodeLib.getRes<egret.Texture>("egret_icon_png");
        let icon = new eui.Image(texture);
        this.addChild(icon);
        icon.x = 26;
        icon.y = 33;

        let line = new egret.Shape();
        line.graphics.lineStyle(2, 0xffffff);
        line.graphics.moveTo(0, 0);
        line.graphics.lineTo(0, 117);
        line.graphics.endFill();
        line.x = 172;
        line.y = 61;
        this.addChild(line);


        let colorLabel = new egret.TextField();
        colorLabel.textColor = 0xffffff;
        colorLabel.width = stageW - 172;
        colorLabel.textAlign = "center";
        colorLabel.text = "Hello Egret";
        colorLabel.size = 24;
        colorLabel.x = 172;
        colorLabel.y = 80;
        this.addChild(colorLabel);

        let textfield = new egret.TextField();
        this.addChild(textfield);
        textfield.alpha = 0;
        textfield.width = stageW - 172;
        textfield.textAlign = egret.HorizontalAlign.CENTER;
        textfield.size = 24;
        textfield.textColor = 0xffffff;
        textfield.x = 172;
        textfield.y = 135;
        this.textfield = textfield;

        let button = new eui.Button();
        button.label = "Click!";
        button.horizontalCenter = 0;
        button.verticalCenter = 0;
        this.addChild(button);
        button.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onButtonClick, this);

        const result = await jszip.coreCodeLib.getRes("description_json");
        this.startAnimation(result as any);

        // 加载 sheet 内的资源
        for (let i = 0; i < 100; i++) {
            let sheetBg = new egret.Bitmap(await jszip.coreCodeLib.getRes("bg"));
            this.addChild(sheetBg);
            sheetBg.scaleX = sheetBg.scaleY = i * 0.005;
            sheetBg.x = i * 1;
            sheetBg.y = (stageH - sheetBg.height / 2) - sheetBg.height / 2 * sheetBg.scaleY;
        }
        let sheetImg = new eui.Image(await jszip.coreCodeLib.getRes("on_png"));
        this.addChild(sheetImg);
        sheetImg.x = 200;
        sheetImg.y = 200;

        // 龙骨动画
        for (let i = 0; i < 3; i++) {
            let dragonBone = await jszip.dragonBoneSprite("buyu", {
                armatureName: "buyu",
                animationName: "buyu",
                playTimes: i,
                completeHandler: (e) => {
                    // console.info(e.target, e.type);
                },
                startPlayHandler: (e) => {
                    // console.info(e.target, e.type);
                },
                completeLoopHandler: (e) => {
                    // console.info(e.target, e.type);
                }
            });

            this.addChild(dragonBone);
            dragonBone.scaleX = dragonBone.scaleY = 0.5;
            dragonBone.x = dragonBone.width * (i + 0.5) * dragonBone.scaleX;
            dragonBone.y = dragonBone.height * 0.5 * dragonBone.scaleY;
            if (i == 2) {
                dragonBone.stop();
                // this.removeChild(dragonBone);
            }
        }

        // MovieClip
        let movieClip = await jszip.movieClipSprite("clipModel", { actionName: "actionClip", playTimes: -1 });
        this.addChild(movieClip);
        movieClip.x = 0;
        movieClip.y = movieClip.height;
        let blurFilter = new egret.BlurFilter(8, 8);
        movieClip.filters = [blurFilter];

        // Sound
        // await jszip.sound.createMusic("music");
        // jszip.sound.musicVolume = 0.5;
        // setTimeout(() => {
        //     jszip.sound.musicStop();
        // }, 3000);

        // for (let i = 0; i < 50; i++) {
        //     await jszip.sound.createEffect("soundEffect");
        //     jszip.sound.effectVolume = (i + 1) * 0.02;
        // }

        // 检查重复资源
        jszip.fileTools.checkingRepeatFile();

        jszip.fileTools.checkingFileSuffix();
    }

    /**
     * 描述文件加载成功，开始播放动画
     * Description file loading is successful, start to play the animation
     */
    private startAnimation(result: Array<any>): void {
        let parser = new egret.HtmlTextParser();

        let textflowArr = result.map(text => parser.parse(text));
        let textfield = this.textfield;
        let count = -1;
        let change = () => {
            count++;
            if (count >= textflowArr.length) {
                count = 0;
            }
            let textFlow = textflowArr[count];

            // 切换描述内容
            // Switch to described content
            textfield.textFlow = textFlow;
            let tw = egret.Tween.get(textfield);
            tw.to({ "alpha": 1 }, 200);
            tw.wait(2000);
            tw.to({ "alpha": 0 }, 200);
            tw.call(change, this);
        };

        change();
    }

    /**
     * 点击按钮
     * Click the button
     */
    private onButtonClick(e: egret.TouchEvent) {
        let panel = new eui.Panel();
        panel.title = "Title";
        panel.horizontalCenter = 0;
        panel.verticalCenter = 0;
        this.addChild(panel);
    }
}