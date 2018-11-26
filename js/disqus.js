const pageIdentifier = window.location.pathname;

var disqus_config = function () {
    this.page.url = window.location.href;
    this.page.identifier = pageIdentifier;
};

function loadDisqus() {
    (function () {
        const script = document.createElement("script");

        script.src = "https://chillicream.disqus.com/embed.js";
        script.setAttribute("data-timestamp", +new Date());
        (document.head || document.body).appendChild(script);
    })();
}

function maybeLoadDisqus() {
    const hr = document.createElement("hr");
    const disqusContainer = document.createElement("disqus");

    disqusContainer.id = "disqus_thread";

    const postContainer = document.querySelectorAll(".lonePost")[0];
    const isBlogArticle = pageIdentifier.indexOf("/blog/") !== -1;

    if (postContainer && isBlogArticle) {
        postContainer.appendChild(hr);
        postContainer.appendChild(disqusContainer);
        loadDisqus();
    }
}

document.addEventListener("DOMContentLoaded", function () {
    maybeLoadDisqus();
});