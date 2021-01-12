# **egretLoadZip简介**
此项目为`egret`通过`jszip`库解析并管理资源  
可完全脱离原有`assetsmanager`资源管理系统  
PS：此方式为异步加载
***

## 支持项
- **获取资源**  
json、png、gif、jpg、jpeg、bmp、mp3、ogg、mpeg、wav、m4a、mp4、aiff、wma、mid  
*`gif`格式建议使用`Texture Merger`工具转换成帧动画形式使用  
`spriteSheet`内的`image`可直接通过二级资源名称获取到
- **获取对象**  
dragonBone、movieClip、sound
***

## 使用方式
命令行安装`cross-zip`和`cross-zip-cli`
```typescript
//全局安装  
npm install cross-zip -g  
npm install cross-zip-cli -g
```

在`egretProperties.json`内加入`jszip`、`dragonBones`两个必需库的引用。之后`egret build -e`编译引擎
```json
{
    "name": "dragonBones"
},
{
    "name": "jszip",
    "path": "libs/libsrc/jszip"
}
```

`Main.ts`内初始化资源
```typescript
private async runGame() {
    await this.loadResource();
    // 初始化资源
    await jszip.jsZipCoreCodeLib.initRes();
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
    if (jszip.jsZipCoreCodeLib.resNamePathMap[source]) {
        let _data = await jszip.jsZipCoreCodeLib.getRes(source);
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
new ZipPlugin({
    mergeSelector: (path) => {
        if (path.indexOf("resource/assets/") >= 0) {
            return "/resource/assets.cfg";
        }
        return "";
    }
})
```

完事儿之后`egret build`一下会在`/resource/`下生成`assets.cfg文件`（不会连这个都不知道吧？）

# **步入正题**
## 获取资源
```typescript
await jszip.jsZipCoreCodeLib.getRes("<fileName>_[type]");
```
> 任何资源（不清楚都包含哪些资源请回看开头的支持项）都可以通过传入`<fileName>_[type]`这种方式来获取  
> 如果不传入`[type]`，则会从压缩包内查找对应`<fileName>`的资源，如有同名不同类型的资源则会按照`[type]`首字母`a-z`的优先级返回第一个匹配项

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
