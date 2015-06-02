
##合并压缩代码
```
node r.js -o baseUrl=js name=main out=built.js
```

##合并压缩时排除文件
```
node r.js -o baseUrl=js name=main out=built.js excludeShallow=selector
```

##只合并不压缩
```
node r.js -o baseUrl=js name=main out=built.js optimize=none
```

