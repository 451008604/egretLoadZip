namespace jszip {
    /**
     * @author ghq `create by 2021-01-13`
     */
    class FileTools {

        constructor() {
        }

        /**
         * 二进制对比方式检查重复文件。（只在开发环境下可用）
         * @param zipData `jszip`生成的解析内容
         * @returns 重复文件列表
         */
        public async checkingRepeatFile(zipData: JSZip = coreCodeLib.zipData) {
            if (!DEBUG) return;

            let cached = Object.create(null);
            let output = Object.create(null);
            for (let i in zipData.files) {
                cached[i] = await zipData.files[i].async("base64");
            }
            for (let i in cached) {
                let base64str1 = cached[i];
                for (let j in cached) {
                    if (j == i) continue;
                    if (base64str1 == cached[j]) {
                        if (!output[i]) {
                            output[i] = Object.create(null);
                            output[i][i] = cached[i];
                        }
                        output[i][j] = cached[j];
                        delete cached[i];
                        delete cached[j];
                    }
                }
            }
            return output;
        }

        /**
         * 检查压缩包内含有的文件格式
         * @param resNamePathMap 资源名称与文件路径的映射
         * @returns 文件格式列表
         */
        public checkingFileSuffix(resNamePathMap: Object = coreCodeLib.resNamePathMap) {
            let tempArr = [];
            for (let i in resNamePathMap) {
                let str: string = resNamePathMap[i];
                if (tempArr.indexOf(str.substring(str.lastIndexOf(".") + 1)) == -1) {
                    tempArr.push(str.substring(str.lastIndexOf(".") + 1));
                }
            }
            return tempArr;
        }
    }

    /**文件工具 */
    export let fileTools = new FileTools();
}