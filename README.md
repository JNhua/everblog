# EverBlog

[![NPM version][npm-image]][npm-url]
[![Build status][travis-image]][travis-url]
[![Dependency Status][david-image]][david-url]
[![License][license-image]][license-url]
[![Downloads][downloads-image]][downloads-url]

EverBlog = write blogs in your evernote.

## How to use

```bash
$ npm install -g https://github.com/JNhua/everblog.git
```

### Config
```bash
$ vim ~/.everblogrc
```
like this:
```bash
token: xxx
noteStoreUrl: 'xxx'
serviceHost: app.yinxiang.com
sandbox: false

```

Open evernote:

1. create a new notebook named `myblog`
2. write some notes with tag `published`

Then:
```bash
$ DEBUG=* everblog start
```

Finally push your github-pages.


**Tips**:

`token` and `noteStoreUrl` get from:

- [evernote](https://www.evernote.com/api/DeveloperToken.action)
- [印象笔记](https://app.yinxiang.com/api/DeveloperToken.action)

## Test

```bash
npm test
```

## Error Handling

see [https://dev.evernote.com/doc/articles/error_handling.php](https://dev.evernote.com/doc/articles/error_handling.php).

## License

MIT

[npm-image]: https://img.shields.io/npm/v/everblog.svg?style=flat-square
[npm-url]: https://npmjs.org/package/everblog
[travis-image]: https://img.shields.io/travis/everblogjs/everblog.svg?style=flat-square
[travis-url]: https://travis-ci.org/everblogjs/everblog
[david-image]: http://img.shields.io/david/everblogjs/everblog.svg?style=flat-square
[david-url]: https://david-dm.org/everblogjs/everblog
[license-image]: http://img.shields.io/npm/l/everblog.svg?style=flat-square
[license-url]: LICENSE
[downloads-image]: http://img.shields.io/npm/dm/everblog.svg?style=flat-square
[downloads-url]: https://npmjs.org/package/everblog
