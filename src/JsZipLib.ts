module jszip {
    class JsZipLib {
        constructor() {
        }

        private jsZip: JSZip;
        /**资源名称与文件路径的映射 */
        resList: Object = Object.create(null);
        private sheetList: Object = Object.create(null);

        initRes() {
            return new Promise<JSZip>(async (resolve, reject) => {
                // 加载zip文件
                const data = await RES.getResAsync("assets_cfg");
                // 解析zip文件内容
                const zipdata = await JSZip.loadAsync(data);
                // 获取所有资源的相对路径
                const filePathList = Object.keys(zipdata.files);
                // 遍历files给每一项资源标记简称（file_jpg : "resource\assets\file.jpg"）
                for (let i = 0; i < filePathList.length; i++) {
                    // 文件完整路径
                    const filePath = filePathList[i];
                    // 文件后缀标记位置
                    const lastPointNum = filePath.lastIndexOf(".");
                    // 文件路径，不包含文件名
                    const lastPathNum = filePath.lastIndexOf("\\");
                    // 文件后缀
                    const fileSuffix = filePath.substring(lastPointNum + 1);
                    if (lastPointNum != -1) {
                        let keyName = "";
                        let fileName = "";
                        // 如果不是在根目录下
                        if (lastPathNum != -1) {
                            fileName = filePath.substring(lastPathNum + 1, lastPointNum);
                            keyName = fileName + "_" + fileSuffix;
                        } else {
                            fileName = filePath.substring(0, lastPointNum);
                            keyName = fileName + "_" + fileSuffix;
                        }
                        this.resList[keyName] = filePath;
                    }
                }

                this.jsZip = zipdata;
                resolve(zipdata);

                this.getSheetList();

                if (DEBUG) {
                    console.groupCollapsed("zip解析");
                    console.info("获取资源原始数据 : ", data);
                    console.info("JSZIP解析原始数据 : ", zipdata);
                    console.info("获取包内所有资源的路径 : ", filePathList);
                    console.info("资源名称和路径的映射 : ", this.resList);
                    console.groupEnd();
                }
            })
        }

        /**
         * 获取图集 sheet 信息
         */
        private async getSheetList() {
            let keys = Object.keys(this.resList);
            for (let i = 0; i < keys.length; i++) {
                let fileName = keys[i].substring(0, keys[i].lastIndexOf("_"));
                if (keys.indexOf(fileName + "_png") != -1 && keys.indexOf(fileName + "_json") != -1) {
                    let data = await this.getJson<SheetDataByType>(fileName + "_json");
                    this.sheetList[fileName] = Object.keys(data.frames);
                }
            }
            if (DEBUG) {
                console.info("全部图集 sheet 信息：", this.sheetList);
            }
        }

        /**
         * 获取一个 egret.Texture 对象。可用于赋值给 egret.Bitmap的texture属性 和 eui.Image的source属性
         * @param _name 资源名称。例：image_jpg
         * @param _dataType 要解析的类型。默认：arraybuffer
         */
        async getTexture(_name: string, _dataType: JSZip.OutputType = "arraybuffer"): Promise<egret.Texture> {
            let texture = new egret.Texture();
            let fileData = null;
            if (this.resList[_name]) {
                fileData = await this.getFileData(_name, _dataType);
                texture = await new Promise<egret.Texture>((resolve, reject) => {
                    egret.BitmapData.create(_dataType as any, fileData as any, (data) => {
                        texture.bitmapData = data;
                        resolve(texture);
                    });
                });
            } else {
                texture = await this.getSheetSpriteTexture(_name);
            }

            if (DEBUG) {
                console.groupCollapsed("createBitmapByName", _name);
                console.info("fileData : ", fileData);
                console.info("texture : ", texture);
                console.groupEnd();
            }
            return texture;
        }

        /**
         * 获取一个 json 数据
         * @param _name 资源名称。例：json_json
         */
        async getJson<T = {}>(_name: string): Promise<T> {
            let str = await this.getFileData(_name, "text");
            return str ? JSON.parse(str) : {};
        }

        /**
         * 获取一个合集 sheet 内的子 texture
         * @param _name 资源名称。例：image_png
         */
        private async getSheetSpriteTexture(_name: string) {
            for (let i in this.sheetList) {
                if (this.sheetList[i].indexOf(_name) != -1) {
                    let sheetConfig = await this.getJson<SheetDataByType>(`${i}_json`);
                    let sheetTexture = await this.getTexture(`${i}_png`);
                    let spriteSheet = new egret.SpriteSheet(sheetTexture);
                    let texture = spriteSheet.createTexture(
                        _name,
                        sheetConfig.frames[_name].x,
                        sheetConfig.frames[_name].y,
                        sheetConfig.frames[_name].w,
                        sheetConfig.frames[_name].h,
                        sheetConfig.frames[_name].offX,
                        sheetConfig.frames[_name].offY,
                        sheetConfig.frames[_name].sourceH,
                        sheetConfig.frames[_name].sourceW
                    );
                    return texture;
                }
            }
        }

        /**
         * 获取一个文件内容
         * @param _name 资源名称。
         * @param _dataType 要解析成的类型
         */
        private getFileData(_name: string, _dataType: JSZip.OutputType) {
            if (DEBUG) {
                console.groupCollapsed("getFileData", _name)
                console.info("name : ", _name);
                console.info("dataType : ", _dataType);
                console.groupEnd();
            }
            return this.jsZip.files[this.resList[_name]] ? this.jsZip.files[this.resList[_name]].async<any>(_dataType) : console.error("压缩文件内未找到 " + _name + " 资源");
        }
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

    /**
     * sheet 图集的数据类型
     */
    interface SheetDataByType {
        file: string,
        frames: {
            [key: string]: SheetSpriteDataByType
        }
    }

    export let jsziplib = new JsZipLib();
}