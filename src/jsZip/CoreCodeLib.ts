namespace jszip {
    /**
     * @author ghq `create by 2020-12-27`
     */
    class CoreCodeLib {

        /**JSZIP解析得到的原始数据 */
        private jsZip: JSZip;
        /**已经从压缩包内获取过的资源缓存 */
        private resCache: Object = Object.create(null);
        /**所有的纹理图集 */
        private textureSheet: Object = Object.create(null);
        /**包含`sheet`图集内资源和未合图资源的总名称列表 */
        private totalResName: Object = Object.create(null);
        private _resNamePathMap: Object = Object.create(null);
        /**资源名称与文件路径的映射 */
        public get resNamePathMap(): Object {
            // 此方式返回一个_resNamePathMap副本，防止外部修改_resNamePathMap
            return Object["assign"]({}, this._resNamePathMap);
        }

        /**
         * 加载并初始化资源
         * @param _compressedPackageName 压缩包名称
         */
        public initRes(_compressedPackageName: string) {
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
                        // 文件路径长度，不包含文件名。   filePath.lastIndexOf("/")适配Unix风格路径
                        const lastPathNum = filePath.lastIndexOf("\\") != -1 ? filePath.lastIndexOf("\\") : filePath.lastIndexOf("/");
                        // Unix下会把文件夹路径视为单文件，通过判断路径如果以`/`结尾则跳过处理
                        if (lastPathNum + 1 == filePath.length) {
                            continue;
                        }
                        if (lastPointNum != -1 && lastPathNum != -1) {
                            let keyName = filePath.substring(lastPathNum + 1).split(".").join("_");
                            this._resNamePathMap[keyName] = filePath;
                            this.totalResName[keyName] = keyName;
                        }
                    }

                    // 多压缩包加载合并
                    if (!this.jsZip) {
                        this.jsZip = zipdata;
                    } else {
                        Object["assign"](this.jsZip.files, zipdata.files);
                    }
                    await this.getSheetList();
                    resolve(this.jsZip);

                    // 检查重复资源。
                    jszip.fileTools.checkingRepeatFile(this.jsZip.files);
                    // 检查资源格式。
                    jszip.fileTools.checkingFileSuffix(coreCodeLib.resNamePathMap);

                    if (DEBUG) {
                        console.groupCollapsed("zip解析");
                        console.info(`获取资源原始数据 : `, loader.data);
                        console.info(`JSZIP解析原始数据 : `, zipdata);
                        console.info(`资源名称和路径的映射 : `, this.resNamePathMap);
                        console.groupEnd();
                    }
                }
                if (_compressedPackageName.indexOf("resource/assets/") == -1) {
                    _compressedPackageName = "resource/assets/" + _compressedPackageName;
                }
                // 加载压缩包文件
                const loader: egret.URLLoader = new egret.URLLoader();
                loader.once(egret.Event.COMPLETE, loadComplete, this);
                loader.dataFormat = egret.URLLoaderDataFormat.BINARY;
                loader.load(new egret.URLRequest(_compressedPackageName));
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
                        let arr = Object.keys(data.frames);
                        this.textureSheet[fileName] = arr;
                        for (let name of arr) {
                            this.totalResName[name] = name;
                        }
                    }
                }
            }
            if (DEBUG) {
                console.info(`全部图集 sheet 信息：`, JSON.parse(JSON.stringify(this.textureSheet)));
            }
        }

        /**
         * 获取资源通用方法。获取过的资源会缓存到`resCache`内，重复获取时可以节省性能
         * @param _name 资源名称
         */
        public async getRes<T = any>(_name: string): Promise<T> {
            if (_name.indexOf("http://") == 0 || _name.indexOf("https://") == 0) {
                this.resCache[_name] = await this.getResourceByUrl(_name);
            } else {
                _name = await this.nameNorming(_name);
            }

            // 如果已经获取过，则直接从缓存内取出
            if (this.resCache[_name]) {
                return this.resCache[_name];
            }
            switch (this.typeSelector(_name)) {
                case ENUM_FILE_TYPE.TYPE_XML:
                    this.resCache[_name] = await this.getXML(_name);
                    break;
                case ENUM_FILE_TYPE.TYPE_JSON:
                    this.resCache[_name] = await this.getJson(_name);
                    break;
                case ENUM_FILE_TYPE.TYPE_IMAGE:
                    this.resCache[_name] = await this.getTexture(_name);
                    break;
                case ENUM_FILE_TYPE.TYPE_FONT:
                    this.resCache[_name] = await this.getBitmapFont(_name);
                    break;
                case ENUM_FILE_TYPE.TYPE_TEXT:
                    break;
                case ENUM_FILE_TYPE.TYPE_SOUND:
                    this.resCache[_name] = await this.getSound(_name);
                    break;
                case ENUM_FILE_TYPE.TYPE_TTF:
                    break;
                case ENUM_FILE_TYPE.TYPE_BIN:
                    this.resCache[_name] = await this.getFileData(_name, "arraybuffer");
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
         * 获取一个网络资源
         * @param _url 网络地址
         */
        private async getResourceByUrl(_url: string) {
            return await new Promise((resolve, reject) => {
                egret.ImageLoader.crossOrigin = "anonymous";
                const loader: egret.URLLoader = new egret.URLLoader();
                let loadComplete = (event: egret.Event) => { };
                let arr = _url.split("/");
                let str = arr[arr.length - 1];
                let index = str.indexOf("?");
                let name = "";
                if (index != -1) {
                    name = str.substring(0, index).split(".").join("_");
                } else {
                    name = str.substring(0).split(".").join("_");
                }
                switch (this.typeSelector(name)) {
                    case ENUM_FILE_TYPE.TYPE_IMAGE:
                        loader.dataFormat = egret.URLLoaderDataFormat.TEXTURE;
                        loadComplete = (event: egret.Event) => {
                            resolve(event.target.data);
                        };
                        break;
                    case ENUM_FILE_TYPE.TYPE_JSON:
                        loader.dataFormat = egret.URLLoaderDataFormat.TEXT;
                        loadComplete = (event: egret.Event) => {
                            resolve(JSON.parse(event.target.data));
                        };
                        break;
                    case ENUM_FILE_TYPE.TYPE_TEXT:
                        loader.dataFormat = egret.URLLoaderDataFormat.TEXT;
                        loadComplete = (event: egret.Event) => {
                            resolve(event.target);
                        };
                        break;
                    case ENUM_FILE_TYPE.TYPE_SOUND:
                        loader.dataFormat = egret.URLLoaderDataFormat.SOUND;
                        loadComplete = (event: egret.Event) => {
                            resolve(event.target);
                        };
                        break;
                    default:
                        loader.dataFormat = egret.URLLoaderDataFormat.BINARY;
                        loadComplete = (event: egret.Event) => {
                            resolve(event.target.data);
                        };
                        break;
                }
                loader.once(egret.Event.COMPLETE, loadComplete, this);
                loader.once(egret.IOErrorEvent.IO_ERROR, (event: egret.IOErrorEvent) => {
                    resolve(null);
                }, this);
                loader.load(new egret.URLRequest(_url));
            });
        }


        /**
         * 获取一个`xml`数据
         * @param _name 资源名称。例：xxxx_xml
         */
        private async getXML(_name: string): Promise<any> {
            let str: string = await this.getFileData(_name, "text");
            // 防止文件编码格式为 `UTF-8 with BOM` 
            if (str && str.match("\\ufeff")) {
                str = str.substring(1);
            }
            let parser = new DOMParser();
            let xmlDoc = parser.parseFromString(str, "text/xml");
            let isParse = true;
            function check(xmlDoc) {
                for (let i = 0; i < xmlDoc.childNodes.length; i++) {
                    let node_i = xmlDoc.childNodes[i];
                    if (node_i.nodeType == 1 && node_i["localName"] != "parsererror") {
                        check(node_i);
                    } else {
                        isParse = false;
                    }
                }
            }
            check(xmlDoc);
            if (isParse) {
                return egret.XML.parse(str);
            } else {
                return null;
            }
        }

        /**
         * 获取一个`json`数据
         * @param _name 资源名称。例：xxxx_json
         */
        private async getJson<T = {}>(_name: string): Promise<T> {
            let str: string = await this.getFileData(_name, "text");
            // 防止文件编码格式为 `UTF-8 with BOM` 
            if (str && str.match("\\ufeff")) {
                str = str.substring(1);
            }
            return str ? JSON.parse(str) : str;
        }

        /**
         * 获取一个`egret.Texture`对象。可用于赋值给`egret.Bitmap`的`texture`属性 和`eui.Image`的`source`属性
         * @param _name 资源名称。例：image_jpg
         * @param _dataType 要解析的类型。默认：arraybuffer
         */
        private async getTexture(_name: string, _dataType: JSZip.OutputType = "arraybuffer"): Promise<egret.Texture> {
            let texture = null;
            let fileData = await this.getFileData(_name, _dataType);
            if (fileData) {
                texture = await new Promise<egret.Texture>((resolve, reject) => {
                    egret.BitmapData.create(_dataType as any, fileData as any, (data) => {
                        texture = new egret.Texture();
                        texture.bitmapData = data;
                        resolve(texture);
                    });
                });
            } else {
                texture = await this.getSheetSpriteTexture(_name);
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
                // length=0 说明该图集内的所有子图都已在 resCache 缓存完毕。
                if (this.textureSheet[arr[i]].length == 0) {
                    this.jsZip.remove(this.textureSheet[arr[i]] + "_png");
                    this.jsZip.remove(this.textureSheet[arr[i]] + "_json");
                }
                const index = this.textureSheet[arr[i]].indexOf(_name);
                if (index != -1) {
                    const sheetConfig = await this.getRes(`${arr[i]}_json`) as DataType_sheet;
                    const sheetTexture = await this.getRes(`${arr[i]}_png`);
                    const spriteSheet = new egret.SpriteSheet(sheetTexture);
                    const config = sheetConfig.frames[_name];
                    const texture = spriteSheet.createTexture(
                        _name, config.x, config.y, config.w, config.h, config.offX, config.offY, config.sourceW, config.sourceH
                    );
                    if (config["scale9grid"]) {
                        let list: Array<string> = config["scale9grid"].split(",");
                        texture["scale9Grid"] = new egret.Rectangle(parseInt(list[0]), parseInt(list[1]), parseInt(list[2]), parseInt(list[3]));
                    }
                    this.textureSheet[arr[i]].splice(index, 1);
                    return texture;
                }
            }
            return null;
        }

        /**
         * 获取一个位图字体格式
         * @param _name 资源名称。
         */
        private async getBitmapFont(_name: string) {
            const fileName = _name.substring(0, _name.lastIndexOf("_"));
            const texture = await this.getTexture(`${fileName}_png`);
            const config = await this.getJson(`${fileName}_fnt`);
            return new egret.BitmapFont(texture, config);
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
                    reject(console.error(`${_name}音频资源获取失败：${data}`));
                }, this);
                sound.load(url);
            })
        }

        /**
         * 获取一个文件内容
         * @param _name 资源名称
         * @param _dataType 要解析成的类型
         */
        private async getFileData(_name: string, _dataType: JSZip.OutputType) {
            return this.resNamePathMap[_name] ? this.jsZip.files[this.resNamePathMap[_name]].async<any>(_dataType) : this.jsZip.files[this.resNamePathMap[_name]];
        }

        /**
         * 名称标准化
         * @param _name 资源名称
         */
        private async nameNorming(_name: string) {
            for (let i in this.totalResName) {
                if (this.totalResName[i].indexOf(_name) == 0 && (_name.length == this.totalResName[i].lastIndexOf("_") || _name.length == this.totalResName[i].length)) {
                    return this.totalResName[i];
                }
            }
            // 加载新的压缩包
            for (let i in generateResourceConfig) {
                let temp1 = generateResourceConfig[i];
                for (let j in temp1) {
                    if (j.indexOf(_name) == 0 && (_name.length == j.lastIndexOf("_") || _name.length == j.length)) {
                        await this.initRes(i + ".cfg");
                        return await this.nameNorming(_name);
                    }
                }
            }
            return _name;
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
    export const coreCodeLib = new CoreCodeLib();
}