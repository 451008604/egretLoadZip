# **egretLoadZip简介**
此项目为`egret`通过`jszip`库解析并管理资源  
可完全脱离原有`assetsmanager`资源管理系统  
*PS：所有资源获取方式均为异步*

## 优势：
- 大幅减少http请求次数  
- 开发环境下可以自动通过对比文件二进制内容来筛选重复资源  
- 不需要维护default.res.json（但是资源该配置还是要配置，毕竟Egret UI Editor还要用）  

## 劣势：
- 尚不明确

## 支持项
- **获取资源**  
json、png、gif、jpg、jpeg、bmp、mp3、ogg、mpeg、wav、m4a、mp4、aiff、wma、mid、fnt、xml  
*`gif`格式建议使用`Texture Merger`工具转换成帧动画形式使用  
`spriteSheet`内的`image`可直接通过二级资源名称获取到
- **获取对象**  
dragonBone、movieClip、sound、bitmapFont

## 使用方式
命令行安装`cross-zip`和`cross-zip-cli`
```typescript
//全局安装  
npm install cross-zip -g  
npm install cross-zip-cli -g
```

需要把libs/libsrc内的jszip库复制到项目下  
在`egretProperties.json`内加入`jszip`、`dragonBones`两个必需库的引用  
之后`egret build -e`编译引擎
```json
{
    "name": "dragonBones"
},
{
    "name": "jszip",
    "path": "libs/libsrc/jszip"
}
```

`cmd.exe`运行一下`GenerateResourceConfig.js`文件，会在`src/jsZip/`下生成`GenerateResourceConfig.ts`字典文件
```typescript
node GenerateResourceConfig.js
```

`Main.ts`内初始化资源（**其实不初始化资源也可以，在用到资源的时候会自动从字典内查找对应的压缩包然后异步加载**）
```typescript
private async runGame() {
    await this.loadResource();
    // 初始化资源
    await jszip.coreCodeLib.initRes();
    this.createGameScene();
}
```

需要修改`AssetAdapter`内的`getAsset`为如下形式：
```typescript
public async getAsset(source: string, compFunc: Function, thisObject: any): Promise<void> {
    function onGetRes(data: any) {
        compFunc.call(thisObject, data, source);
    }
    // 引用拦截。如果在压缩包内存在对应资源，则采用jszip方式
    if (jszip.coreCodeLib.resNamePathMap[source]) {
        let _data = await jszip.coreCodeLib.getRes(source);
        onGetRes(_data)
    } else if (RES.hasRes(source)) {
        let data = RES.getRes(source);
        if (data) {
            onGetRes(data);
        }
        else {
            RES.getResAsync(source, onGetRes, this);
        }
    }
    else {
        RES.getResByUrl(source, onGetRes, this, RES.ResourceItem.TYPE_IMAGE);
    }
}
```

编译、打包发布时在`scripts/config.ts`内加入脚本插件
```typescript
// 单包压缩
new ZipPlugin({
    mergeSelector: (path) => {
        if (path.indexOf("resource/assets/") >= 0) {
            return "/resource/assets/assets.cfg";
        }
        return "";
    }
})
// 分包压缩。"resource/assets/"下的每一个文件目录为一个压缩包
new ZipPlugin({
    mergeSelector: (path) => {
        let arr = path.split("/");
        if (arr[2] && arr.length > 3) {
            return "resource/assets/" + arr[2] + ".cfg";
        }
        return "";
    }
})
```

之后`egret build`一下会在`/resource/assets/`下生成对应的`压缩包文件`

# **步入正题**
## 获取资源
```typescript
// 任何资源（不清楚都包含哪些资源请回看开头的支持项）都可以通过传入`<fileName>_[type]`这种方式来获取  
// 如果不传入`[type]`，则会从压缩包内查找对应`<fileName>`的资源，如有同名不同类型的资源则会按照`[type]`首字母`a-z`的优先级返回第一个匹配项
await jszip.coreCodeLib.getRes("<fileName>_[type]");
```

## 获取龙骨动画
```typescript
let dragonBone = await jszip.DragonBoneSprite.create(
    // <fileName>
    "xxxx",
    {
        // 骨架数据名
        armatureName: "xxxx",
        // 动画数据名
        animationName: "xxxx",
        // 循环播放次数
        playTimes: 0,
        // 开始播放时的回调
        startPlayHandler: (e) => { console.info(e.target, e.type); },
        // 播放结束时的回调
        completeHandler: (e) => { console.info(e.target, e.type); },
        // 每次循环播放时都会执行的回调
        completeLoopHandler: (e) => { console.info(e.target, e.type); }
    }
);
```

## 获取帧动画
```typescript
let movieClip = await jszip.movieClipSprite(
    // <fileName>
    "xxxx",
    {
        // 动画名称
        actionName: "xxxx",
        // 循环次数
        playTimes: 0
    }
);
```

## 获取音频
```typescript
// 此方式会生成一个全局唯一的背景音乐对象
await jszip.sound.createMusic("xxxx");
// 设置音量
jszip.sound.musicVolume = 1;
// 播放背景音乐
jszip.sound.musicPlay();
// 停止背景音乐（暂停）
jszip.sound.musicStop();

// 此方式会生成一个临时的音效对象
await jszip.sound.createEffect("xxxx");
// 设置音量
jszip.sound.effectVolume = 1;
```

## 获取位图字体
```typescript
// 只需传入`<fileName>`即可获取一个对应的`egret.BitmapFont`对象
let font = await jszip.coreCodeLib.getRes("<fileName>");
// 赋值给`egret.BitmapText`的`font`属性
let text: egret.BitmapText = new egret.BitmapText();
text.font = font;
text.text = "xxxx";
this.addChild(text);
```

## 获取XML文件内容
```typescript
// `RES.ResourceItem.TYPE_XML`类型的文件都可以用此方式获取
let xml = await jszip.coreCodeLib.getRes("xxxx_xml");
```

## 获取网络资源
```typescript
// 以`https`或`http`开头的路径会被当做网络地址加载资源。
// 根据后缀名`png、jpg、gif、jpeg、bmp、json、text、mp3、ogg、mpeg、wav、m4a、mp4、aiff、wma、mid`自动返回相应的数据类型
// 如传入的后缀名不符合此范围则返回`ArrayBuffer`数据类型
let data = await jszip.coreCodeLib.getRes("https://xxxx.<type>");
```
