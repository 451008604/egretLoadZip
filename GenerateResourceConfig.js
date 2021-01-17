const fs = require("fs");
const path = require("path");
const fileList = {};
const basePath = 'resource/assets/';
let code = `namespace jszip {\n\n    /**资源名称与路径映射 */\n    export let generateResourceConfig = {\n`;

function mapDir(dir) {
    let pathArr = dir.split("/");
    let readdirSync = fs.readdirSync(dir);
    if (dir.lastIndexOf("/") == dir.length - 1 && pathArr.length == 4)
        code += `        ${pathArr[2]}: {\n`;
    for (let filePath of readdirSync) {
        let pathName = path.join(dir, filePath).split("\\").join("/");
        let index = filePath.lastIndexOf(".");
        let fileName = filePath.split(".").join("_");
        // 单文件
        if (index > 0) {
            if (fileList[fileName] || pathArr.length < 4) continue;

            fileList[fileName] = fileName;
            code += (`            "${fileName}": "${pathName}",\n`);
        }
        // 文件夹
        else {
            mapDir(pathName + "/");
        }
    }
    if (dir.lastIndexOf("/") == dir.length - 1 && pathArr.length == 4)
        code += `        },\n`;
}
mapDir(basePath);

code += `    }\n}`;
fs.writeFileSync("src/jsZip/GenerateResourceConfig.ts", code);
