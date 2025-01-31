const _ = require('lodash')
const fse = require('fs-extra')
const parser = require('js-yaml')
const moment = require('moment')
const fm = require('front-matter')
const entities = require('entities')
const enml2text = require('enml2text')
const debug = require('debug')('everblog-adaptor-hexo')
const urlencode = require('urlencode')

var enml2html = require('enml2html') // use var for easy mock in mocha testing
const cheerio = require('cheerio')
const format = require('string-format')
const Promise = require('bluebird')
const path = require('path')
const sanitize = require('sanitize-filename')
const os = require('os')

module.exports = async function adaptor(data, cleanMode = false) {
  for (let note of data.posts) {
    var defaultFrontMatter = {
      title: note.title,
      date: formatDate(note.created),
      updated: formatDate(note.updated),
      tags: note.tags,
      category: note.category,
      mathjax: true,
      toc: false
    }

    if (note.attributes.contentClass === 'yinxiang.markdown') {
      processMarkdownNote(note, defaultFrontMatter)
    } else {
      note.webApiUrlPrefix = data.$webApiUrlPrefix
      processOrdinaryNote(note, defaultFrontMatter)
      sleep(5000)
    }
  }
  debug('build success!')
}

function processMarkdownNote(note, defaultFrontMatter) {
  let allContent = entities.decodeHTML(enml2text(note.content))
  let allContentArray = allContent.split('\n')
  let encodedContentMarkdown = allContentArray[allContentArray.length - 1]
  let contentMarkdown = urlencode.decode(encodedContentMarkdown, 'utf-8')

  // delete [TOC]
  let lines = contentMarkdown.split('\n')
  if (lines[0] === '[TOC]') {
    defaultFrontMatter.toc = true
    contentMarkdown = lines.slice(1,).join('\n').trim()
  }

  // add <!--more-->
  lines = contentMarkdown.split('\n')
  let row = 0
  let digestLen = 0
  while (lines[row][0] === '#' || lines[row].substring(0, 3) == "```") {
    digestLen += lines[row].length
    // skip code
    if (lines[row].substring(0, 3) == "```") {
      row++
      while (lines[row].substring(0, 3) != "```") {
        digestLen += lines[row].length
        row++
      }
    } else {
      row++
    }

    if (row > 2 && digestLen >= 20) {
      break
    }
  }

  lines.splice(row + 1, 0, '<!--more-->')
  contentMarkdown = lines.join('\n')

  let data = fm.parse(contentMarkdown)
  _.merge(data.attributes, defaultFrontMatter)
  contentMarkdown = fm.stringify(data)

  const filename = 'source/_posts/' + note.title + '.md'
  fse.outputFileSync(filename, contentMarkdown)
  // debug(`title: ${filename}, content(markdown): ${JSON.stringify(contentMarkdown)}`)
  debug(`${filename}`)
}

function processOrdinaryNote(note, defaultFrontMatter) {
  let contentMarkdown = enml2html(note)

  let $ = cheerio.load(contentMarkdown)
  const attributes = note.attributes
  if (attributes) {
    const sourceApplication = note.attributes.sourceApplication
    if (sourceApplication && (sourceApplication === 'maxiang')) {
      $('h1').remove()
    }
  }

  // Download all images and update the src attribute.
  if (note.resources) {
    for (let res of note.resources) {
      resolveNoteResource(res, note.category + '@' + note.title, $)
    }
  }

  // longdesc and alt field will make the HTML show the picture name on page.
  // That is not expected for some inline pictures.
  // Just remove them.
  $('img').attr('longdesc', '')
  $('img').attr('alt', '')
  // Originally, they are inline-block, which will make the view be out of page scope.
  // Making it as block will force everything in scope.
  // $('div').css('display', 'block')
  contentMarkdown = $.html()
  contentMarkdown = removeSpecialChar(contentMarkdown)

  var info = fm(contentMarkdown)
  _.merge(info.attributes, defaultFrontMatter)
  contentMarkdown = fmStringify(info)

  const dist = process.cwd() + '/source/_posts/'
  const filename = (dist + info.attributes.category + '@' + info.attributes.title + '.html')
  fse.outputFileSync(filename, contentMarkdown)
  // debug('title-> %s, content-> %s', info.attributes.category + '@' + info.attributes.title, contentMarkdown)
  debug(info.attributes.category + '@' + info.attributes.title)
}

function resolveNoteResource(resData, title, html) {
  let fileName = resData.attributes.fileName || Date.now().toString()
  fileName = path.basename(fileName.replace(/_/g, ''))
  const hash = bodyHashToString(resData.data.bodyHash)
  const imgFile = format('/images/{}/{}', sanitize(title), fileName)
  fse.outputFileSync(format('{}/source/{}', process.cwd(), imgFile), new Buffer(resData.data.body), 'binary')
  html(format('img[hash="{}"]', hash)).attr('src', imgFile)
}

function removeSpecialChar(html) {
  html = html.replace(/.*<!DOCTYPE/, '<!DOCTYPE')
  html = html.replace(/{{/g, '&#123;&#123;')
  return html.replace(/}}/g, '&#125;&#125;')
}

function formatDate(timestamp) {
  return moment(timestamp).format('YYYY/M/DD HH:mm:ss')
}

function bodyHashToString(bodyHash) {
  let str = '';
  for (let i in bodyHash) {
    let hexStr = bodyHash[i].toString(16);
    if (hexStr.length === 1) {
      hexStr = '0' + hexStr;
    }
    str += hexStr;
  }
  return str;
}

function fmStringify(obj, opt) {
  obj = obj || {}
  opt = opt || {}
  var attributes = obj.attributes || {}
  var body = obj.body || {}
  var scope = opt.scope || '---'

  if (Object.keys(attributes).length === 0) {
    return body
  }

  var yaml = parser.dump(attributes)
  yaml = scope + os.EOL + yaml + scope + os.EOL + body

  return yaml
}

function sleep(ms) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, ms);
  });
}
