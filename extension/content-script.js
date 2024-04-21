function getItem(key) {
  return JSON.parse(localStorage.getItem(key));
}

var data = getItem('currentSupercastFID');

if (data) {
  chrome.runtime.sendMessage({ fid: data });
} else {
  const item = getItem('REACT_QUERY_OFFLINE_CACHE');
  if (item?.clientState) {
    chrome.runtime.sendMessage({ fid: item.clientState.queries[0].queryKey[1] });
  }
}
