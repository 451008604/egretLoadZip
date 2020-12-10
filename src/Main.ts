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
            egret.ticker.pause();
        }

        egret.lifecycle.onResume = () => {
            egret.ticker.resume();
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

        await this.loadResource()
        console.time("initRes");
        Main.JSZIP = await this.initRes() as JSZip;
        console.timeEnd("initRes");

        let R = RES as any;
        //重写RES.ResourceLoader的loadResource
        R.ResourceLoader.prototype.loadResource = function (r: RES.ResourceInfo, p?: RES.processor.Processor) {
            console.log(r, p);
            if (!p) {
                if (RES.FEATURE_FLAG.FIX_DUPLICATE_LOAD == 1) {
                    var s = RES.host.state[r.root + r.name];
                    if (s == 2) {
                        return Promise.resolve(RES.host.get(r));
                    }
                    if (s == 1) {
                        return r.promise;
                    }
                }
                p = RES.processor.isSupport(r);
            }
            if (!p) {
                throw new RES.ResourceManagerError(2001, r.name, r.type);
            }
            RES.host.state[r.root + r.name] = 1;

            var promise = null;
            if (Main.JSZIP && Main.JSZIP.file(Main.ResList[r.name])) {
                console.log(Main.JSZIP.file(Main.ResList[r.name]).async("base64"));
                promise = Main.JSZIP.file(Main.ResList[r.name]).async("base64");
            } else {
                promise = p.onLoadStart(RES.host, r);
            }
            r.promise = promise;
            console.log(r)
            return promise;
        }
        this.createGameScene();
        // const result = await RES.getResAsync("description_json")
        // this.startAnimation(result);
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
            await RES.loadGroup("preload", 0, loadingView);
            this.stage.removeChild(loadingView);
        }
        catch (e) {
            console.error(e);
        }
    }

    private loadTheme() {
        return new Promise((resolve, reject) => {
            // load skin theme configuration file, you can manually modify the file. And replace the default skin.
            //加载皮肤主题配置文件,可以手动修改这个文件。替换默认皮肤。
            let theme = new eui.Theme("resource/default.thm.json", this.stage);
            theme.addEventListener(eui.UIEvent.COMPLETE, () => {
                resolve();
            }, this);

        })
    }

    private textfield: egret.TextField;
    /**
     * 创建场景界面
     * Create scene interface
     */
    protected async createGameScene() {
        console.time();
        let sky = await this.createBitmapByName("bg_jpg")
        console.timeEnd()
        this.addChild(sky);
        let stageW = this.stage.stageWidth;
        let stageH = this.stage.stageHeight;
        sky.width = stageW;
        sky.height = stageH;

        let topMask = new egret.Shape();
        topMask.graphics.beginFill(0x000000, 0.5);
        topMask.graphics.drawRect(0, 0, stageW, 172);
        topMask.graphics.endFill();
        topMask.y = 33;
        this.addChild(topMask);

        let icon = await this.createBitmapByName("egret_icon_png");
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
    }

    static JSZIP: JSZip;
    static ResList: Object = Object.create(null);

    private initRes() {
        return new Promise(async (resolve, reject) => {
            let self = this;
            // 加载zip文件
            const _data = await RES.getResByUrl("resource/assets.cfg").catch((err) => {
                console.error(err.error);
            });
            // 解析zip文件内容
            const _zipdata = await JSZip.loadAsync(_data);
            console.info("_zipdata", _zipdata);
            // 获取所有资源的相对路径
            let filePathList = Object.keys(_zipdata.files);
            console.info("filePathList", filePathList);
            // 遍历files给每一项资源标记简称（file_jpg : "resource\assets\file.jpg"）
            for (let i = 0; i < filePathList.length; i++) {
                const filePath = filePathList[i];
                if (filePath.lastIndexOf(".") != -1) {
                    let keyName = "";
                    // 如果不是在根目录下
                    if (filePath.lastIndexOf("\\") != -1) {
                        keyName = filePath.substring(filePath.lastIndexOf("\\") + 1, filePath.lastIndexOf(".")) + "_" + filePath.substring(filePath.lastIndexOf(".") + 1);
                    } else {
                        keyName = filePath.substring(0, filePath.lastIndexOf(".")) + "_" + filePath.substring(filePath.lastIndexOf(".") + 1);
                    }
                    if (filePath.indexOf("\\")) {
                        (filePath as any).replaceAll("\\", "\\\\");
                    }

                    Main.ResList[keyName] = filePath;
                }
            }
            resolve(_zipdata)
            console.info("Main.ResList", Main.ResList);
        })
    }


    private async createBitmapByName(name: string) {
        // let _base64 = await Main.JSZIP.files[Main.ResList[name]].async("base64");
        let _base64 = await Main.JSZIP.file(Main.ResList[name]).async("base64");
        // console.info("_base64", _base64)
        const tag = name.substring(name.lastIndexOf("_") + 1);
        _base64 = "data:image/" + tag + ";base64," + _base64;
        let img = new eui.Image();
        img.source = _base64;
        // img.source = name;
        return img as eui.Image;
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
