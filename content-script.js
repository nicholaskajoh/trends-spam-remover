Tsr = {
  /**
   * Get list of trends from the "Trends for you" section at https://twitter.com/search?q=xxxxx.
   */
  async getTrendsList() {
    let trendsContainer = document.querySelector('[aria-label="Timeline: Trending now"]');
    while (!trendsContainer) {
      // Wait for trends section to load.
      await TsrUtils.sleep(1);
      trendsContainer = document.querySelector('[aria-label="Timeline: Trending now"]');
    }
    trendsContainer = trendsContainer.querySelector(':scope > div'); // Unwrap trends list.
    let trendsList = Array.from(trendsContainer.children).slice(2, -1); // Remove divs which do not contain trends (i.e first 2 and last divs).
    trendsList = trendsList
      .map(el => { // Extract trends.
        let trend = null;
        try {
          trend = el.querySelector(':scope > div > div').children[1].querySelector(':scope > span > span').innerText; // Hashtag selector.
        } catch (e1) {
          try {
            trend = el.querySelector(':scope > div > div').children[1].querySelector(':scope > span').innerText; // Keyword trend selector.
          } catch (e2) {}
        }

        return trend;
      })
      .filter(trend => trend !== null) // Filter out null if any.
      .map(trend => trend.toLowerCase());

    return trendsList;
  },

  /**
   * Get div containing search timeline tweets.
   */
  async getTweetsContainer() {
    let tweetsContainer = document.querySelector('[aria-label="Timeline: Search timeline"]');
    while (!tweetsContainer) {
      // Wait for tweets section to load.
      await TsrUtils.sleep(1);
      tweetsContainer = document.querySelector('[aria-label="Timeline: Search timeline"]');
    }
    tweetsContainer = tweetsContainer.querySelector(':scope > div'); // Unwrap tweets list.

    return tweetsContainer;
  },

  /**
   * Get list of tweets in search timeline.
   */
  async getSearchTlTweets(tweetsList = null) {
    let tweets = [];
    if (tweetsList) {
      tweets = tweetsList;
    } else {
      const tweetsContainer = await Tsr.getTweetsContainer();
      tweets = Array.from(tweetsContainer.children);
    }
    
    tweets = tweets
      .map(el => { // Extract tweets.
        let tweet = null;
        const tsrTweetId = `tsr_tweet_${TsrUtils.generateRandomString(10)}`;
        el.classList.add(tsrTweetId); // Set IDs (class names) on tweet divs which we can use to hide the ones that are spam.
        try {
          tweet = el // Tweet selector.
            .querySelector(':scope > div > div > article > div > div > div')
            .children[1].children[1].children[1]
            .innerText;
        } catch (e) {}

        return { id: tsrTweetId , text: tweet };
      })
      .filter(tweet => tweet.text !== null) // Filter out null if any.
      .map(tweet => ({ ...tweet, text: tweet.text.toLowerCase() }));

    return tweets;
  },

  async removeSpamTweets(tweets) {
    const debug = await TsrUtils.getOption('debug');
    const trends = await Tsr.getTrendsList();
    if (debug) console.log({ currentTrends: trends });
    let sensitivity = await TsrUtils.getOption('sensitivity');
    sensitivityThreshold = TsrConsts.SENSITIVITY_THRESHOLDS[sensitivity];

    for (const tweet of tweets) {
      const trendsInTweet = trends.map(trend => tweet.text.includes(trend) ? 1 : 0);
      const numTrendsInTweet = trendsInTweet.reduce((partialSum, el) => partialSum + el, 0);
      if (numTrendsInTweet >= sensitivityThreshold) {
        // Remove tweet.
        const tweetDiv = document.getElementsByClassName(tweet.id)[0];
        if (tweetDiv) tweetDiv.style.display = 'none';
        if (debug) console.log('Tweet removed: ' + JSON.stringify(tweet));
      }
    }
  },

  async run() {
    const debug = await TsrUtils.getOption('debug');
    const initialTweets = await Tsr.getSearchTlTweets();
    if (debug) console.log({ initialTweets });
    await Tsr.removeSpamTweets(initialTweets);

    /**
     * Listen for changes in the tweets container and rerun removeTweetsSpam() when new tweets are added.
     */
    const tweetsContainer = await Tsr.getTweetsContainer();
    const options = {
      childList: true,
    };
    const observer = new MutationObserver(async (mutations) => {
      let newTweets = [];
      for (let mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length) {
          newTweets.push(...mutation.addedNodes);
        }
      }
      if (newTweets.length) {
        newTweets = await Tsr.getSearchTlTweets(newTweets);
        if (debug) console.log({ newTweets });
        Tsr.removeSpamTweets(newTweets);
      }
    });

    observer.observe(tweetsContainer, options);
  },

  async main() {
    const enabled = await TsrUtils.getOption('enabled');
    if (enabled) {
      await Tsr.run();

      /**
       * Listen for changes to URL in the address bar and recreate mutation observer for tweets container
       * when user returns to the trending tweets page.
       *
       * Context: twitter.com is an SPA, so URL changes don't result in a page load.
       * When a user leaves the page for viewing trending tweets, the tweets container is destroyed,
       * meaning, the mutation observer won't work when they return so we need to recreate it.
       * 
       * PS: We're using a mutation observer to create another mutation observer. Nice!!!
       */
      let previousUrl = '';
      const observer = new MutationObserver((mutations) => {
        if (location.href !== previousUrl) {
          if (TsrUtils.isSupportedUrl(location.href) && previousUrl !== '') {
            Tsr.run();
          }
          previousUrl = location.href;
        }
      });
      const options = { subtree: true, childList: true };
      observer.observe(document, options);
    }
  },
};

Tsr.main();
