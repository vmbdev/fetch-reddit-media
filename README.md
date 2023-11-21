# fetch-reddit-media

fetch-reddit-media is a CLI application writen in JavaScript to download media
links from a subreddit or user profile. Originally developed to massively
download images from /r/wallpaper, it can now access most popular providers
such as Imgur or Vidble.

## Getting Started

You can get the latest code from
[here](https://github.com/vmbdev/fetch-reddit-media/archive/refs/heads/main.zip)
or through Git:

```bash
git clone https://github.com/vmbdev/fetch-reddit-media.git
```

### Prerequisites

fetch-reddit-media requires [Node.js](https://nodejs.org/) 18 or later
installed on your system.

### Installation

First of all, we need to install its dependencies. Open a terminal and get to
the directory where it's installed and run the following command:

```bash
npm install
```

Then we'll need to configure the app. Rename **config.example.js** to
**config.js** and edit it:

```javascript
export const config = {
  resultFile: './results.txt',
  plugins: [
    'imgur',
    'redgifs',
    'vidble',
    // 'gfycat'
  ],
  reddit: {
    userAgent: '',
    clientId: '',
    clientSecret: '',
    refreshToken: '',
  },
  imgur: {
    clientId: '',
    clientSecret: ''
  }
}
```

* **resultFile**: The file containing the links fetched in a search.
* **plugins**: List of providers to fetch the media on those platforms. For
example, to download gifs or albums from Imgur you need to enable the Imgur
plugin. **NOTE** that as of today, Gfycat doesn't work and there's no idea
when it may work again, or if it will.

#### Getting Reddit credentials

To get access to Reddit you'll need first to create an application
[here](https://www.reddit.com/prefs/apps). Go to the bottom and click on the
button to create an application. When asked about the redirect URI, use the
following:

```text
https://not-an-aardvark.github.io/reddit-oauth-helper/
```

Now you can put your **clientId** and **clientSecret** on the config.js file,
but we'll still need the **refreshToken**. For that, follow the next steps:

1. Navigate to
[Reddit OAuth Helper](https://not-an-aardvark.github.io/reddit-oauth-helper/).

2. On *Generate Token*, fill in the *Client ID* and *Client Secret* we got
earlier.

3. Check *Permanent?*.

4. On the scope list, select at least **read**.

5. Click on **Generate tokens** at the bottom and you'll have your
**refreshToken**.

#### Getting Imgur credentials

To fetch Imgur data we use it's own API rather than scrapping the DOM.
We need to register an application
[here](https://api.imgur.com/oauth2/addclient). We can select anonymous
authorization as we won't access our user account. Once you get your **clientId**
and **clientSecret** you can update your **config.js** with them.

## Usage

You can run the following command to always get the possible command arguments:

```bash
npm run fetch -- --help
```

It will give you:

```text
Usage: fetch-reddit-media [options]

Fetch media from Reddit subreddits and profiles

Options:
  -v, --vers                   output the version number
  -u, --user <username>        Search in a user profile
  -s, --subreddit <subreddit>  Search in a subreddit
  -d, --download               The media found will be downloaded
  -o, --dest <destiny>         When downloading, the output directory
  -m, --max <number>           The number of posts to fetch
  -h, --help                   display help for command
```

At least **--user** or **--subreddit** needs to be present. The following
command will seek for 35 posts in the /r/wallpapers subreddit, and list
the links in the **results.txt** file.

```bash
npm run fetch -- --subreddit wallpapers --max 35
```

If **--download** is present, then instead of listing the links on results.txt
the application will try to download the files to a directory inside /download
with the name of the user or subreddit. We can choose the destination with
**--dest**.

The following command will download all it can find in the wallpapers
subreddit and save it into ~/wallpapers.

```bash
npm run fetch -- --subreddit wallpapers --download --dest ~/wallpapers
```

**NOTE:** when accessing a subreddit it may have thousands of posts. Use
**--max** unless you know what you're doing.

## Built with

* [Node.js](https://nodejs.org/) - JavaScript runtime environment
* [Axios](https://axios-http.com/) - HTTP library
* [Snoowrap](https://github.com/not-an-aardvark/snoowrap) - Reddit API wrapper
* [JSDOM](https://github.com/jsdom/jsdom) - DOM/HTML implementation
* [Commander](https://github.com/tj/commander.js) - Command-line interface

## License

fetch-reddit-media is licensed under the MIT License - see the
[LICENSE](https://github.com/vmbdev/fetch-reddit-media/blob/main/LICENSE)
file for more details.
