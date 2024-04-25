async function responseToJson(url) {
  const response = await fetch(url, {
    method: 'GET',
    // headers: {
    //   authority: 'www.degen.tips',
    //   method: 'GET',
    //   path: '/api/airdrop2/season3/points?address=0xde8f202db8cddc52797a10bd67faf14ab42c65a5',
    //   scheme: 'https',
    //   Accept:
    //     'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    //   'Accept-Encoding': 'gzip, deflate, br, zstd',
    //   'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
    //   'Cache-Control': 'max-age=0',
    //   Cookie: "wagmi.store={'state':{'connections':{'__type':'Map','value':[]},'chainId':8453,'current':null},'version':2}",
    //   Priority: 'u=0, i',
    //   'Sec-Ch-Ua': "'Chromium';v='124', 'Google Chrome';v='124', 'Not-A.Brand';v='99'",
    //   'Sec-Ch-Ua-Mobile': '?0',
    //   'Sec-Ch-Ua-Platform': 'Windows',
    //   'Sec-Fetch-Dest': 'document',
    //   'Sec-Fetch-Mode': 'navigate',
    //   'Sec-Fetch-Site': 'none',
    //   'Sec-Fetch-User': '?1',
    //   'Upgrade-Insecure-Requests': '1',
    //   'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    // },
  });
  console.log(response);
  return await response.json().catch(console.error);
}

async function setUserinfo(fid) {
  const GET_PROFILE_URL = `https://www.supercast.xyz/api/profile?fid=${fid}`;
  const { user } = await responseToJson(GET_PROFILE_URL);
  const { username, avatar, connectedAddress: address, displayName } = user;

  const USE_POINT_URL = `https://www.degen.tips/api/airdrop2/season3/points?address=${address}`;
  const USE_TIP_URL = `https://www.degen.tips/api/airdrop2/tip-allowance?address=${address}`;

  const [getPointInfo] = await responseToJson(USE_POINT_URL);
  const { points: my_point } = getPointInfo;

  const { user_rank, tip_allowance, remaining_allowance } = (await responseToJson(USE_TIP_URL))[0];

  const userInfo = {
    username,
    avatar,
    address,
    displayName,
    my_point,
    user_rank,
    tip_allowance,
    remaining_allowance,
  };

  console.error(JSON.stringify(userInfo));

  chrome.runtime.sendMessage({ action: 'LOGIN_SUCCESS', fid, address, userInfo });
}

function getItem(key) {
  return JSON.parse(localStorage.getItem(key));
}

(async () => {
  const data = getItem('currentSupercastFID');

  if (data) {
    await setUserinfo(data);
  } else {
    const item = getItem('REACT_QUERY_OFFLINE_CACHE');
    if (item?.clientState) {
      await setUserinfo(item.clientState.queries[0].queryKey[1]);
    }
  }
})();
