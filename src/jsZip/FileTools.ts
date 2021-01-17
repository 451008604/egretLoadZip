namespace jszip {
    /**
     * @author ghq `create by 2021-01-13`
     */
    class FileTools {

        constructor() {
        }

        /**
         * 二进制对比方式检查重复文件。（只在开发环境下可用）
         * @param _files `jsZip`解析出的数据
         * @returns 重复文件列表
         */
        public async checkingRepeatFile(_files: any) {
            if (!DEBUG) return;

            let files = {};
            Object["assign"](files, _files);
            let cached = Object.create(null);
            let output = Object.create(null);
            for (let i in files) {
                let base64 = await files[i].async("base64");
                if (base64) {
                    cached[i] = base64;
                }
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
            files = null;
            return output ? console.info("扫描出的重复文件：", output) : null;
        }

        /**
         * 检查压缩包内含有的文件格式。（只在开发环境下可用）
         * @param resNamePathMap 资源名称与文件路径的映射
         * @returns 文件格式列表
         */
        public checkingFileSuffix(resNamePathMap: Object) {
            if (!DEBUG) return;

            let tempArr = [];
            for (let i in resNamePathMap) {
                let str: string = resNamePathMap[i];
                if (tempArr.indexOf(str.substring(str.lastIndexOf(".") + 1)) == -1) {
                    tempArr.push(str.substring(str.lastIndexOf(".") + 1));
                }
            }
            return tempArr ? console.info("项目资源包含的文件格式：", tempArr) : null;
        }
    }

    /**文件工具 */
    export let fileTools = new FileTools();
}