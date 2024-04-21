function checkDomainAndClearStorage(warpcastDomain, supercastDomain) {
  chrome.tabs.query({}, function (tabs) {
    let domainExists = tabs.some((tab) => (tab.url && tab.url.match(warpcastDomain)) || tab.url.match(supercastDomain));

    if (!domainExists) {
      chrome.storage.local.clear(function () {
        console.log('Storage is cleared because no tabs with the domain are open.');
      });
    } else {
      console.log('Domain is open in some tabs. Storage not cleared.');
    }
  });
}

const checkTap = () => {
  const warpcastDomain = /^https:\/\/.*\.supercast\.xyz\/.*$/;
  const supercastDomain = /^https:\/\/.warpcast\.com\/.*$/;
  checkDomainAndClearStorage(warpcastDomain, supercastDomain);
};

chrome.runtime.onInstalled.addListener(checkTap);

chrome.tabs.onRemoved.addListener(checkTap);

chrome.tabs.onUpdated.addListener(checkTap);
