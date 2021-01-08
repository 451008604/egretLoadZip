# egretLoadZip
> 此项目为`egret`通过`jszip`库加载并解析资源。
> 基本替代了原有`assetsmanager`（因为只有在加载压缩包的时候使用到了）

PS：此方式为异步加载

## 支持的资源格式
JSON、image、spriteSheet、dragonBone

## 使用方式
在编译、打包发布时在`scripts/config.ts`内加入脚本插件
```javascript
new ZipPlugin({
    mergeSelector: (path) => {
        if (path.indexOf("resource/assets/") >= 0) {
            return "/resource/assets.cfg";
        }
        return "";
    }
})
```

在`egretProperties.json`内加入`jszip`、`dragonBones`两个必需库的引用。之后`egret b -e`编译引擎
```json
{
    "name": "dragonBones"
},
{
    "name": "jszip",
    "path": "libs/libsrc/jszip"
}
```

需要修改`AssetAdapter`内的`getAsset`为如下形式：
```javascript
public async getAsset(source: string, compFunc: Function, thisObject: any): Promise<void> {
    function onGetRes(data: any) {
        compFunc.call(thisObject, data, source);
    }
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

获取资源
>任何资源都可以通过传入`<fileName>_[type]`这种方式来获取。如果不传入`_type`，则会从压缩包内查找对应`fileName`的资源，如有同名不同类型的资源则会返回`bin`类型
```javascript
await jszip.jsZipCoreCodeLib.getRes("<fileName>_[type]");
```

获取龙骨动画
```javascript
let dragonBone = await jszip.DragonBoneSprite.create(
        "xxxx", //<fileName>
        {
            armatureName: "xxxx",//骨架数据名
            animationName: "xxxx",//动画数据名
            playTimes: 0,//循环播放次数
            completeHandler: (e) => { console.info(e.target, e.type); },//开始播放时的回调
            startPlayHandler: (e) => { console.info(e.target, e.type); },//播放结束时的回调
            completeLoopHandler: (e) => { console.info(e.target, e.type); }//每次循环播放时都会执行的回调
        });
```

