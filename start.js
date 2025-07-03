const dev = false;

import "../components.js";

let settings =
    localStorage.getItem("settings") ||
    JSON.stringify({
        backgroundColor: "#202124",
        bookmarksColor: "#3c3c3c",
        hide: true,
        enableImages: true,
        interval: 60,
    });

function save() {
    localStorage.setItem("settings", JSON.stringify(settings));
}

settings = JSON.parse(settings);

const settingsPanel = document.querySelector("#settings");
const body = document.querySelector("body");
const bookmarksBar = document.querySelector("#bookmarks");
body.style.backgroundColor = settings.backgroundColor;
bookmarksBar.style.backgroundColor = settings.bookmarksColor;

const backgroundColorSetting = document.querySelector("#setting-background-color");
backgroundColorSetting.value = settings.backgroundColor;

backgroundColorSetting.addEventListener("input", (_event) => {
    settings.backgroundColor = backgroundColorSetting.value;
    body.style.backgroundColor = backgroundColorSetting.value;
    save();
});

const bookmarksColorSetting = document.querySelector("#setting-bookmarks-color");
bookmarksColorSetting.value = settings.bookmarksColor;

bookmarksColorSetting.addEventListener("input", (_event) => {
    settings.bookmarksColor = bookmarksColorSetting.value;
    bookmarksBar.style.backgroundColor = bookmarksColorSetting.value;
    save();
});

const hideSetting = document.querySelector("#setting-hide");
hideSetting.value = settings.hide;

hideSetting.addEventListener("input", (_event) => {
    settings.hide = hideSetting.value;
    save();
});

const settingsButton = document.querySelector("#settings-hide");
const settingsIcon = document.querySelector("#settings-hide > svg");
let hidden = true;

let settingsBounding = settingsPanel.getBoundingClientRect();
settingsPanel.style.bottom = `-${dev ? 0 : settingsBounding.height}px`;

if (!settings.hide) settingsButton.style.opacity = "1";

settingsButton.addEventListener("click", (_event) => {
    if (hidden) {
        settingsPanel.style.bottom = "";
        settingsIcon.style.rotate = "-90deg";

        if (settings.hide) settingsButton.style.opacity = "1";
    } else {
        settingsBounding = settingsPanel.getBoundingClientRect();
        settingsPanel.style.bottom = `-${settingsBounding.height}px`;
        settingsIcon.style.rotate = "90deg";

        if (settings.hide) settingsButton.style.opacity = "0.05";
    }

    hidden = !hidden;
});

window.addEventListener("resize", () => {
    if (hidden) {
        settingsBounding = settingsPanel.getBoundingClientRect();
        settingsPanel.style.bottom = `-${settingsBounding.height}px`;
    }
});

chrome.runtime
    ? chrome.runtime.sendMessage({ type: "bookmarks" }, (response) => {
          const bar = response.bookmarks?.[0]?.children?.find((node) => node?.folderType == "bookmarks-bar");

          if (!bar?.children?.length) {
              bookmarksBar.style.display = "none";
              return;
          }

          bar?.children.forEach((bookmark) => {
              if (bookmark.children) {
                  return;
              }

              const anchor = document.createElement("a");
              anchor.classList.add("bookmark");
              anchor.href = bookmark.url;

              const icon = document.createElement("img");
              icon.alt = bookmark.url;
              icon.src = `chrome-extension://doelhcgjeeeokkcpnfpmjfamagknjimb/_favicon/?pageUrl=${
                  new URL(bookmark.url).origin
              }&size=16`;
              anchor.appendChild(icon);

              const span = document.createElement("span");
              span.innerText = bookmark.title;
              anchor.appendChild(span);

              bookmarksBar.appendChild(anchor);
          });
      })
    : (() => {
          bookmarksBar.style.display = "none";
      })();

function openDb(name) {
    return new Promise(async (resolve, _reject) => {
        const db = await indexedDB.open(name, 2);

        db.onupgradeneeded = (event) => {
            const db = event.target.result;
            db.createObjectStore("images", { keyPath: "id", autoIncrement: true });
        };

        db.onerror = () => console.error("Failed to open image database");
        db.onsuccess = () => {
            resolve([
                db.result,
                () => {
                    const tx = db.result.transaction("images", "readwrite");
                    return [tx.objectStore("images"), tx];
                },
            ]);
        };
    });
}

const enableSetting = document.querySelector("#setting-images-enable");
const intervalSetting = document.querySelector("#setting-images-interval");
let images = [];

enableSetting.value = settings.enableImages;
intervalSetting.value = settings.interval;

enableSetting.addEventListener("input", async (_event) => {
    settings.enableImages = enableSetting.value;

    if (!enableSetting.value) {
        document.body.style.backgroundImage = "";
    } else if (images.length != 0) {
        const index =
            images.length == 1
                ? 0
                : await (async () => {
                      const timestamp = new Date().getTime() / 1000;
                      const seed = Math.floor(timestamp / (settings.interval * 60));
                      return await seededRandom(images.length, seed);
                  })();

        const imageUrl = URL.createObjectURL(images[index]);
        document.body.style.backgroundImage = `url(${imageUrl})`;
    }

    save();
});

function fileToURL(file) {
    return new Promise((resolve, _reject) => {
        let reader = new FileReader();

        reader.onload = () => resolve(reader.result);
        reader.onerror = () => console.error("Could not read File into URL");
        reader.readAsDataURL(file);
    });
}

intervalSetting.addEventListener("input", (_event) => {
    if (intervalSetting.value == 0) return;

    settings.interval = intervalSetting.value;
    save();
});

async function seededRandom(max, seed) {
    const enc = new TextEncoder();
    const seedBytes = enc.encode(seed.toString());
    const hashBuffer = await crypto.subtle.digest("SHA-256", seedBytes);
    const hashArray = new Uint8Array(hashBuffer);
    const value = (hashArray[0] << 24) | (hashArray[1] << 16) | (hashArray[2] << 8) | hashArray[3];

    return (value >>> 0) % max;
}

function resizeImage(file, size) {
    return new Promise(async (resolve, reject) => {
        const img = document.createElement("img");
        img.src = await fileToURL(file);
        img.style.display = "none";

        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.height = size;
            canvas.width = size;
            canvas.style.display = "none";

            const ctx = canvas.getContext("2d");
            const imageWidth = img.width;
            const imageHeight = img.height;
            const scale = Math.max(size / imageWidth, size / imageHeight);
            const scaledWidth = imageWidth * scale;
            const scaledHeight = imageHeight * scale;
            const posX = (size - scaledWidth) / 2;
            const posY = (size - scaledHeight) / 2;

            ctx.drawImage(img, posX, posY, scaledWidth, scaledHeight);

            canvas.toBlob(
                (blob) => {
                    img.remove();
                    canvas.remove();
                    resolve(blob);
                },
                "image/webp",
                0.9
            );
        };
    });
}

(async () => {
    const [db, createStore] = await openDb("imageDb");
    const [thumbDb, createThumbStore] = await openDb("thumbnailDb");
    const thumbnails = [];
    let [store, tx] = createStore();

    const imagePromise = new Promise((resolve, _reject) => {
        store.openCursor().onsuccess = async (event) => {
            const cursor = event.target.result;

            if (!cursor) {
                await tx.done;
                resolve();
                return;
            }

            const file = cursor.value.blob;
            file.id = cursor.value.id;

            images.push(file);
            cursor.continue();
        };
    });

    await imagePromise;

    [store, tx] = createThumbStore();

    const thumbnailPromise = new Promise((resolve, _reject) => {
        store.openCursor().onsuccess = async (event) => {
            const cursor = event.target.result;

            if (!cursor) {
                await tx.done;
                resolve();
                return;
            }

            const file = cursor.value.blob;
            file.id = cursor.value.id;
            file.imageId = cursor.value.imageId;

            thumbnails.push(file);
            cursor.continue();
        };
    });

    await thumbnailPromise;

    if (settings.enableImages && images.length) {
        const index =
            images.length == 1
                ? 0
                : await (async () => {
                      const timestamp = new Date().getTime() / 1000;
                      const seed = Math.floor(timestamp / (settings.interval * 60));
                      return await seededRandom(images.length, seed);
                  })();

        const imageUrl = URL.createObjectURL(images[index]);
        document.body.style.backgroundImage = `url(${imageUrl})`;
    }

    const add = document.querySelector("#image-add");
    const container = document.querySelector("#image-container");

    function rerenderImageContainer() {
        [...(container?.childNodes || [])].forEach((child) => {
            if (child.id !== "image-add") child.remove();
        });

        images.forEach(async (file) => {
            let thumbnail = thumbnails.find((t) => t.imageId == file.id);

            if (!thumbnail) {
                thumbnail = await resizeImage(file, 100);

                await new Promise((resolve, _reject) => {
                    const [store, tx] = createThumbStore();

                    const req = store.add({ blob: thumbnail, imageId: file.id });
                    req.onsuccess = async () => {
                        thumbnail.id = req.result;
                        thumbnail.imageId = file.id;
                        thumbnails.push(thumbnail);

                        await tx.done;
                        resolve();
                    };
                });
            }

            const url = thumbnail.url || URL.createObjectURL(thumbnail);
            thumbnail.url = url;

            const div = document.createElement("div");
            div.style.backgroundImage = `url(${url})`;

            div.addEventListener("click", async () => {
                const [store, tx] = createStore();
                const req = store.delete(file.id);

                req.onsuccess = () => {
                    div.remove();
                    images = images.filter((f) => f.id != file.id);

                    const thumbnail = thumbnails.find((t) => t.imageId == file.id);

                    if (thumbnail) {
                        const [store, tx] = createThumbStore();
                        store.delete(thumbnail.id);
                        store.onsuccess = async () => {
                            await tx.done;
                        };
                    }
                };

                await tx.done;
            });

            container.appendChild(div);
        });
    }

    rerenderImageContainer();

    add.addEventListener("click", (_event) => {
        const upload = document.createElement("input");
        upload.type = "file";
        upload.style.display = "none";
        upload.accept = "image/*";
        document.body.appendChild(upload);

        upload.addEventListener("input", async (event) => {
            const file = upload.files?.[0];
            if (!file) return;

            const [store, done] = createStore();
            const req = store.add({ blob: file });

            req.onsuccess = async () => {
                file.id = req.result;
                images.push(file);
                rerenderImageContainer();
                await done;
            };
        });

        upload.click();
    });
})();
