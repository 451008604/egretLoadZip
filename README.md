# egretLoadZip
此项目为`egret`通过`jszip`库加载并解析资源。
基本替代了原有`assetsmanager`（因为只有在加载压缩包的时候使用到了）

PS：此方式为异步加载

## 目前支持的资源格式
JSON、image、spriteSheet

## 使用方式
在编译、打包发布时在`scripts/config.ts`内加入脚本插件
```
new ZipPlugin({
    mergeSelector: (path) => {
        if (path.indexOf("resource/assets/") >= 0) {
            return "/resource/assets.cfg";
        }
        return "";
    }
})
```
在`egretProperties.json`内加入`jszip`库的引用
```
{
    "name": "jszip",
    "path": "libs/libsrc/jszip"
}
```
获取资源
```
await jszip.jsZipCoreCodeLib.getRes("bg_jpg");
```
任何资源都可以通过传入`<fileName>_[type]`这种方式来获取。如果不传入`_type`，则会从压缩包内查找对应`fileName`的资源，如有同名不同类型的资源则优先获取`image`类型
