namespace jszip {
    /**
     * @author ghq `create by 2020-12-27`
     */
    class JsZipCoreCodeLib {

        /**JSZIP解析得到的原始数据 */
        private jsZip: JSZip;
        /**已经从压缩包内获取过的资源缓存 */
        private resCache: Object = Object.create(null);
        /**所有的纹理图集 */
        private textureSheet: Object = Object.create(null);
        /**包含`sheet`图集内资源和未合图资源的总名称列表 */
        private totalResName: string[] = [];
        /**资源名称与文件路径的映射 */
        public resNamePathMap: Object = Object.create(null);
        public get zipData() {
            return this.jsZip;
        }

        public initRes() {
            return new Promise<JSZip>((resolve, reject) => {
                const loadComplete = async (e: egret.Event) => {
                    // 解析压缩包文件内容
                    const zipdata = await JSZip.loadAsync(loader.data);
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
                                keyName = `${fileName}_${fileSuffix}`;
                            } else {
                                fileName = filePath.substring(0, lastPointNum);
                                keyName = `${fileName}_${fileSuffix}`;
                            }
                            this.resNamePathMap[keyName] = filePath;
                            this.totalResName.push(keyName);
                        }
                    }

                    this.jsZip = zipdata;
                    resolve(zipdata);

                    this.getSheetList();

                    if (DEBUG) {
                        console.groupCollapsed("zip解析");
                        console.info(`获取资源原始数据 : `, loader.data);
                        console.info(`JSZIP解析原始数据 : `, zipdata);
                        console.info(`资源名称和路径的映射 : `, this.resNamePathMap);
                        console.groupEnd();
                    }
                }
                // 加载压缩包文件
                const loader: egret.URLLoader = new egret.URLLoader();
                loader.once(egret.Event.COMPLETE, loadComplete, this);
                loader.dataFormat = egret.URLLoaderDataFormat.BINARY;
                loader.load(new egret.URLRequest("resource/assets.cfg"));
            })
        }

        /**
         * 获取图集`sheet`信息
         */
        private async getSheetList() {
            const keys = Object.keys(this.resNamePathMap);
            for (let i = 0; i < keys.length; i++) {
                const fileName = keys[i].substring(0, keys[i].lastIndexOf("_"));
                if (keys.indexOf(`${fileName}_png`) != -1 && keys.indexOf(`${fileName}_json`) != -1 && !this.textureSheet[fileName]) {
                    const data = await this.getRes(`${fileName}_json`) as DataType_sheet;
                    if (Object.keys(data).length == 2 && data.frames && data.file) {
                        this.textureSheet[fileName] = Object.keys(data.frames);
                        this.totalResName.push(...Object.keys(data.frames));
                    }
                }
            }
            if (DEBUG) {
                console.info(`全部图集 sheet 信息：`, this.textureSheet);
            }
        }


        /**
         * 获取资源通用方法。获取过的资源会缓存到`resCache`内，重复获取时可以节省性能
         * @param _name 资源名称
         */
        public async getRes<T = any>(_name: string): Promise<T> {
            // 名称标准化
            for (let i = 0, j = this.totalResName.length; i < j; i++) {
                if (this.totalResName[i].indexOf(_name) == 0 && _name.length == this.totalResName[i].lastIndexOf("_")) {
                    _name = this.totalResName[i];
                    break;
                }
            }
            // 如果已经获取过，则直接从缓存内取出
            if (this.resCache[_name]) {
                return this.resCache[_name];
            }
            switch (this.typeSelector(_name)) {
                case ENUM_FILE_TYPE.TYPE_XML:
                    break;
                case ENUM_FILE_TYPE.TYPE_JSON:
                    this.resCache[_name] = await this.getJson(_name);
                    break;
                case ENUM_FILE_TYPE.TYPE_SHEET:
                    break;
                case ENUM_FILE_TYPE.TYPE_IMAGE:
                    this.resCache[_name] = await this.getTexture(_name);
                    break;
                case ENUM_FILE_TYPE.TYPE_FONT:
                    break;
                case ENUM_FILE_TYPE.TYPE_TEXT:
                    break;
                case ENUM_FILE_TYPE.TYPE_SOUND:
                    this.resCache[_name] = await this.getSound(_name);
                    break;
                case ENUM_FILE_TYPE.TYPE_TTF:
                    break;
                case ENUM_FILE_TYPE.TYPE_BIN:
                    break;
            }

            if (!this.resCache[_name]) {
                console.error(`error : ${_name} 获取失败！`);
            } else {
                // 删除压缩包内的指定资源，以节省内存占用空间
                if (this.resNamePathMap[_name]) {
                    this.jsZip.remove(this.resNamePathMap[_name]);
                }
            }

            return this.resCache[_name];
        }

        /**
         * 获取一个`json`数据
         * @param _name 资源名称。例：xxxx_json
         */
        private async getJson<T = {}>(_name: string): Promise<T> {
            const str = await this.getFileData(_name, "text");
            return str ? JSON.parse(str) : {};
        }

        /**
         * 获取一个`egret.Texture`对象。可用于赋值给`egret.Bitmap`的`texture`属性 和`eui.Image`的`source`属性
         * @param _name 资源名称。例：image_jpg
         * @param _dataType 要解析的类型。默认：arraybuffer
         */
        private async getTexture(_name: string, _dataType: JSZip.OutputType = "arraybuffer"): Promise<egret.Texture> {
            let texture = new egret.Texture();
            let fileData = null;
            if (this.resNamePathMap[_name]) {
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
                console.groupCollapsed(`createBitmapByName  ${_name}`);
                console.info(`fileData : `, fileData);
                console.info(`texture : `, texture);
                console.groupEnd();
            }
            return texture;
        }

        /**
         * 获取一个图集`sheet`内的子`texture`
         * @param _name 资源名称。例：image_png
         */
        private async getSheetSpriteTexture(_name: string) {
            const arr = Object.keys(this.textureSheet);
            for (let i = 0; i < arr.length; i++) {
                if (this.textureSheet[arr[i]].length == 0) {
                    this.jsZip.remove(this.textureSheet[arr[i]] + "_png");
                    this.jsZip.remove(this.textureSheet[arr[i]] + "_json");
                }
                if (this.textureSheet[arr[i]].indexOf(_name) != -1) {
                    const sheetConfig = await this.getRes(`${arr[i]}_json`) as DataType_sheet;
                    const sheetTexture = await this.getRes(`${arr[i]}_png`);
                    const spriteSheet = new egret.SpriteSheet(sheetTexture);
                    const texture = spriteSheet.createTexture(
                        _name,
                        sheetConfig.frames[_name].x,
                        sheetConfig.frames[_name].y,
                        sheetConfig.frames[_name].w,
                        sheetConfig.frames[_name].h,
                        sheetConfig.frames[_name].offX,
                        sheetConfig.frames[_name].offY,
                        sheetConfig.frames[_name].sourceW,
                        sheetConfig.frames[_name].sourceH
                    );
                    this.textureSheet[arr[i]].splice(i, 1);
                    return texture;
                }
            }
            return null;
        }

        /**
         * 获取一个音频资源。
         * @param _name 资源名称。例：sound_mp3
         */
        private getSound(_name): Promise<egret.Sound> {
            return new Promise(async (resolve, reject) => {
                const fileSuffix = _name.substr(_name.lastIndexOf("_") + 1);
                const url = 'data:audio/' + fileSuffix + ';base64,' + await this.getFileData(_name, "base64");
                const sound: egret.Sound = new egret.Sound();
                sound.addEventListener(egret.Event.COMPLETE, (data: egret.Event) => {
                    resolve(sound);
                }, this);
                sound.addEventListener(egret.IOErrorEvent.IO_ERROR, (data: egret.IOErrorEvent) => {
                    reject(new Error(`${_name}音频资源获取失败：${data}`));
                }, this);
                sound.load(url);
            })
        }

        /**
         * 获取一个文件内容
         * @param _name 资源名称
         * @param _dataType 要解析成的类型
         */
        private getFileData(_name: string, _dataType: JSZip.OutputType) {
            if (DEBUG) {
                console.groupCollapsed(`getFileData  ${_name}`);
                console.info(`name : `, _name);
                console.info(`dataType : `, _dataType);
                console.groupEnd();
            }
            return this.resNamePathMap[_name] ? this.jsZip.files[this.resNamePathMap[_name]].async<any>(_dataType) : console.error(`压缩文件内未找到 ${_name} 资源`);
        }

        /**
         * 获取文件的读取类型
         * 没有查找到的文件类型以二进制格式默认加载
         * @param _name 文件名称
         * @returns 读取文件所用的`Processor`类型
         */
        private typeSelector(_name: string): string {
            let fileSuffix = _name.substr(_name.lastIndexOf("_") + 1);
            let type: string;
            switch (fileSuffix) {
                case ENUM_FILE_TYPE.TYPE_XML:
                case ENUM_FILE_TYPE.TYPE_JSON:
                case ENUM_FILE_TYPE.TYPE_SHEET:
                    type = fileSuffix;
                    break;
                case "png":
                case "jpg":
                case "gif":
                case "jpeg":
                case "bmp":
                    type = ENUM_FILE_TYPE.TYPE_IMAGE;
                    break;
                case "fnt":
                    type = ENUM_FILE_TYPE.TYPE_FONT;
                    break;
                case "txt":
                    type = ENUM_FILE_TYPE.TYPE_TEXT;
                    break;
                case "mp3":
                case "ogg":
                case "mpeg":
                case "wav":
                case "m4a":
                case "mp4":
                case "aiff":
                case "wma":
                case "mid":
                    type = ENUM_FILE_TYPE.TYPE_SOUND;
                    break;
                case "mergeJson":
                case "zip":
                case "pvr":
                    type = fileSuffix;
                    break;
                case "ttf":
                    type = ENUM_FILE_TYPE.TYPE_TTF;
                default:
                    type = ENUM_FILE_TYPE.TYPE_BIN;
                    break;
            }
            return type;
        }
    }

    /**核心库 */
    export const jsZipCoreCodeLib = new JsZipCoreCodeLib();
}