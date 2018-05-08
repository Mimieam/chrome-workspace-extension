import { deduplicateObjectArr } from './utils';

export let GCWindows = {}
export let GCTabs = {}


// populate=true will return populate the tabs property of the window object
GCWindows.getLastFocused = async (populate=false) => {
 let w = await new Promise((resolve) => {
   return chrome.windows.getLastFocused({populate: populate}, t => resolve(t))
  })
  return w
}

GCWindows.getCurrent = async (populate = false) => {
 let w = await new Promise((resolve) => {
   return chrome.windows.getCurrent({populate: populate}, t => resolve(t))
  })
  return w
}
/**
 * This function create a new window with discared tabs if the discard
 * flag is set to true - note that the first and last tabs will not be discared
 * 
 * @param {object} options - an array of strings
 * @param {boolean} discard - a flag
 */
GCWindows._createWindow = async (options = {}, discard = false) => {
  let w = await new Promise((resolve, reject) => {
    return chrome.windows.create(options, async (newW) => { 
      console.log(`New Windows Created with ID : ${ newW.id }`, newW, options.urls)
      // console.log(newW.tabs)
      options.urls = options.urls ? options.urls : []

      const _urls = options.urls.slice(1) // adding the other tabs..
      const tabsPromiseArray = await _urls.map(
        (_url, idx) => {
          if (idx == _urls.length - 1) {
            return GCTabs.createTabAtWindowID(_url, newW.id, false)
          } else {
            return GCTabs.createTabAtWindowID(_url, newW.id, discard)
          }
        }
      )
      // TODO: prevent discard of the very last tab 
      await Promise.all(tabsPromiseArray) // wait to be done
      console.log(newW)
      resolve(newW) // return the newly created window
    })
  })

  return w
}  


/**
 * This function create a new window by recyling as many open tabs as possible 
 * flag is set to true - note that the first and last tabs will not be discared
 * 
 * @param {array} urls - an array of strings
 * @param {boolean} discard - a flag
 */
GCWindows.createWindow = async (urls = [], discard = false) => {
  console.log(urls)
  const recycled = await GCTabs.recycleTabsAndCreateWindow(urls)

  // remove recycled from urls list
  const recycledURLs = recycled.map(t => t.url)

  const tobeNewlyCreated = urls.filter((item, idx) =>  !recycledURLs.includes(item))

  console.log('recycledURLs==>', recycledURLs)
  console.log('tobeNewlyCreated==>', tobeNewlyCreated)

  //TODO: create new windows with the new Tabs, then return the id of created window and move the received tabs to it
  const options = tobeNewlyCreated ? { url : tobeNewlyCreated } : []  // if this is empty we do not pass anything so a blank tab doesn't randomly get added
  const newWindow = await GCWindows._createWindow(options, true)
  console.log('newWindow= ', newWindow, recycled.map(t => t.id))
  GCTabs.move(recycled.map(t => t.id), newWindow.id)
  // let w = await new Promise((resolve, reject) => {
  //   return chrome.windows.create({ url: urls[0],  }, async (newW) => { 
  //     console.log(`New Windows Created with ID : ${ newW.id }`)
  //     console.log(newW.tabs)
  //     const _urls = urls.slice(1) // adding the other tabs..
  //     const tabsPromiseArray = await _urls.map(
  //       (_url, idx) => {
  //         if (idx == _urls.length - 1) {
  //           return GCTabs.createTabAtWindowID(_url, newW.id, false)
  //         } else {
  //           return GCTabs.createTabAtWindowID(_url, newW.id, discard)
  //         }
  //       }
  //     )
  //     // TODO: prevent discard of the very last tab 
  //     return await resolve(Promise.all(tabsPromiseArray))
  //   })
  // })

  // return w
}  

GCTabs._query = async (options) => {  
  let w = await new Promise((resolve) => {
    return chrome.tabs.query(options, t => resolve(t))
   }) 
   return w 
 }

GCTabs.queryByUrl = async (urlString) => {
  /**
   * returns an array of tabs matching the query
   * 
   * note - chrome.tabs.query will not match anything with a # in it
   */
  return await new Promise(async (resolve) => {
    const _url = urlString.split('#')[0]
    let t = await GCTabs._query({ url: _url })
    resolve(t)
  })
}

GCTabs.updateUrlAtTabId = async (tabId, urlStirng) => {
  return await chrome.tabs.update( tabId, {url: urlStirng, active: true} )
}

GCTabs.getLastActiveTabFromAGroupOfTabs =(tabs) => {
  //grab the last active Tab for that url if it exist or select the last tab returned by GCTabs.queryByUrl
  let lastActiveTab = tabs.filter(_t => { return _t.active })[0]
  lastActiveTab = lastActiveTab ? lastActiveTab : tabs.splice(-1)[0]
  return lastActiveTab
}

function splitHostname(url) {
  var result = {};
  var regexParse = new RegExp('([a-z\-0-9]{2,63})\.([a-z\.]{2,5})$');
  var urlParts = regexParse.exec(url);
  result.domain = urlParts[1];
  result.type = urlParts[2];
  result.subdomain = url.replace(result.domain + '.' + result.type, '').slice(0, -1);;
  return result;
}



/**
 * This funciton takes in a array of url string and create a set of 
 * regex pattern for each url, to match any tab similar to it
 * 
 * 
 * @param {array} urls url string
 */
GCTabs.createURLSearchPatterns = (urls) => {
  const _patterns = urls.map(u => {
    const _uObj = splitHostname((new URL(u).hostname ))
    console.log(_uObj)
    // return `*.${_uObj.hostname}.*`
  })
  return _patterns
}

/**
 * This function takes in a array of url string and tries to 
 * find all existing tabs matching the url in the array 
 * and gathers them in 1 Window. 
 * Remaining urls which were not found are simply 
 * added to the new windows as new Tabs
 * @param {array} urls array of url strings
 * @returns array of tabs object like {id: "", url: ""} 
 */
GCTabs.recycleTabsAndCreateWindow = (urls) => {
  let t = new Promise(resolve => { 

    // TODO: i think passing the urls object to query is preventing querying from every window
    chrome.tabs.query({}, tabs => {
      console.log('URLS:', urls)
      console.log('ALL TABS FOUNDS BEFORE RECYCLING', tabs)
      const recycledTabs = tabs
        .filter( _t => urls.includes(_t.url))  
        .map(_t => {
        return {
          'id': _t.id,
          'url': _t.url
        }
      })
      // GCTabs.createURLSearchPatterns(tabs.map(_t => _t.url))
      
      console.log('RecyclableTabs found => ',recycledTabs)
      console.log('RecyclableTabs Dedup => ',deduplicateObjectArr(recycledTabs, 'url'))
      return resolve(recycledTabs)
    }) 
  })
  return t
}

GCTabs.createTabAtWindowID = (url, wID, discard=false) => {
  let t = new Promise(resolve => {
    chrome.tabs.create({ url: url, windowId: wID }, async tab => {
      if (discard) {
        chrome.tabs.onUpdated.addListener(async function listener (tabId, info) {
          if (info.status === 'complete' && tabId === tab.id) {
            await chrome.tabs.discard(tab.id, (discaredTab) => {
              // console.log('Discared Tab:', discaredTab)
              console.log(`created & Unloaded from mem -> ${tab.url}`)
            })
            chrome.tabs.onUpdated.removeListener(listener);
            resolve(tab);
          }
        })
      }
    })
  })
  return t
}


  /**
   * physicaly moves tabs around
   *
   * @param {Array} tabs - array of tabs IDs
   * @param {Number} id - the id of a window
   * @returns 
   */ 

GCTabs.move = (tabs, id)=> {
  return chrome.tabs.move(tabs, {windowId:id, index:-1})
}


export const findAndLoadExtentionPageInNewBrowserTab = async (targetUrl) => {
  // chrome extension url
  console.log('opening - findAndLoadExtentionPageInNewBrowserTab ')
  const extUrl =  `chrome-extension://${chrome.runtime.id }/popup.html`
  
  // grab all tabs matching that target url
  const ext = await GCTabs.queryByUrl(extUrl)

  const tabs = await GCTabs.queryByUrl(`${ targetUrl }`) 

  console.log('tabs', tabs)

  let extUrlIsOpen = GCTabs.getLastActiveTabFromAGroupOfTabs(ext)

  if (extUrlIsOpen) {
    chrome.tabs.update(extUrlIsOpen.id, { active: true })
    console.log(extUrlIsOpen)
    return
  }
  console.log('exit point 2')
  let lastActiveTab = GCTabs.getLastActiveTabFromAGroupOfTabs(tabs)
  
  // update current tab or create a new one
  if (lastActiveTab) {
    console.log('exit point 3')
    await GCTabs.updateUrlAtTabId(lastActiveTab.id, extUrl)
  } else {
    console.log('exit point 4', tabs)
    // if (tabs.len <= 2) {
      await chrome.tabs.create({url:extUrl, active: true})
    // }
  }
}

export const helperAsyncTestFn = async () => {
  let w = await GCWindows.getLastFocused()
  console.log(w)
  let t = await GCTabs.queryByUrl('http://localhost:3000/')
  console.log(t)
 
  //grab the last active Tab for that url if it exist or select the last tab returned by GCTabs.queryByUrl
  let lastActiveTab = t.filter(_t => { return _t.active })[0]
  lastActiveTab = lastActiveTab ? lastActiveTab : t.splice(-1)[0]
  
  console.log('lastActiveTab', lastActiveTab)
  if (lastActiveTab) {
    await GCTabs.updateUrlAtTabId(lastActiveTab.id, `chrome-extension://${chrome.runtime.id }/popup.html`)
  } else {
    await chrome.tabs.create({url:`chrome-extension://${chrome.runtime.id }/popup.html`, active: true})
  }
  
}



