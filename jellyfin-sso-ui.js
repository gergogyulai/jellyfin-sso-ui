(function () {
    const SSO_URL = "/sso/OID/start/authentik";

    const translations = {
        en: {
            login: "Sign in with SSO",
            ssoHeader: "Single Sign-On",
            deleteSelected: "Delete Selected Links",
            confirmDelete: "I want to delete selected links",
            oidHeader: "OpenID Connect",
            samlHeader: "SAML",
            noLinks: "No accounts linked",
            checking: "Checking links...",
            configure: "Configure",
            none: "None configured"
        },
        hu: {
            login: "Bejelentkezés SSO-val",
            ssoHeader: "Egyszeri bejelentkezés (SSO)",
            deleteSelected: "Kijelölt kapcsolatok törlése",
            confirmDelete: "Törölni szeretném a kijelölt kapcsolatokat",
            oidHeader: "OpenID Connect",
            samlHeader: "SAML",
            noLinks: "Nincs kapcsolódó fiók",
            checking: "Kapcsolatok ellenőrzése...",
            configure: "Beállítás",
            none: "Nincs beállítva"
        }
    };

    const getTranslation = (key) => {
        const lang = (document.documentElement.lang || navigator.language).split("-")[0].toLowerCase();
        const dict = translations[lang] || translations["en"];
        return dict[key] || translations["en"][key];
    };

    // Helper to generate the specific DOM structure for Jellyfin checkboxes
    const createCheckboxHTML = (label, inputAttributes) => `
        <label class="emby-checkbox-label">
            <input type="checkbox" is="emby-checkbox" class="emby-checkbox" ${inputAttributes}>
            <span class="checkboxLabel">${label}</span>
            <span class="checkboxOutline">
                <span class="material-icons checkboxIcon checkboxIcon-checked check" aria-hidden="true"></span>
                <span class="material-icons checkboxIcon checkboxIcon-unchecked" aria-hidden="true"></span>
            </span>
        </label>
    `;

    const ssoLogic = {
        loadProviders: (container) => {
            const oidList = container.querySelector("#sso-oid-list");
            const samlList = container.querySelector("#sso-saml-list");

            ApiClient.getJSON(ApiClient.getUrl("sso/OID/GetNames")).then(names => {
                ssoLogic.renderProviderList(oidList, names, "oid");
            });
            ApiClient.getJSON(ApiClient.getUrl("sso/SAML/GetNames")).then(names => {
                ssoLogic.renderProviderList(samlList, names, "saml");
            });
        },

        renderProviderList: (container, providers, mode) => {
            container.innerHTML = "";
            if (!providers || providers.length === 0) {
                container.innerHTML = `<div class="inputContainer" style="opacity:0.6;">${getTranslation("none")}</div>`;
                return;
            }

            providers.forEach(name => {
                const wrapper = document.createElement("div");
                wrapper.className = "inputContainer";
                wrapper.style.cssText = "border-bottom: 1px solid var(--line-separator-color, #444); padding-bottom: 1em; margin-bottom: 1em;";

                wrapper.innerHTML = `
                    <div style="display:flex; align-items:center; justify-content: space-between; margin-bottom: 0.5em;">
                        <span class="inputLabel" style="margin:0; font-weight: 500;">${name}</span>
                        <a href="${ApiClient.getUrl(`SSO/${mode.toUpperCase()}/p/${name}?isLinking=true`)}" class="emby-button raised" style="padding: 0.2em 0.8em; min-width: auto; font-size: 0.9em;">
                            <i class="material-icons" style="font-size: 1.2em; margin-right: 0.4em;">add_link</i>
                            <span>Link</span>
                        </a>
                    </div>
                    <div class="existing-links" data-provider="${name}" data-mode="${mode}" style="display: flex; flex-direction: column;">
                        <span class="loading-text" style="opacity:0.6; font-size:0.9em; font-style: italic;">${getTranslation("checking")}</span>
                    </div>
                `;
                container.appendChild(wrapper);
            });

            const userId = ApiClient.getCurrentUserId();
            const url = ApiClient.getUrl(`sso/${mode.toLowerCase()}/links/${userId}`);

            ApiClient.getJSON(url).then(map => {
                providers.forEach(pName => {
                    const subContainer = container.querySelector(`.existing-links[data-provider="${pName}"]`);
                    if (!subContainer) return;

                    const links = map[pName] || [];
                    subContainer.innerHTML = "";

                    if (links.length === 0) {
                        subContainer.innerHTML = `<div style="font-size:0.9em; opacity:0.6;">${getTranslation("noLinks")}</div>`;
                    } else {
                        links.forEach(link => {
                            const checkboxDiv = document.createElement("div");
                            checkboxDiv.className = "checkboxContainer";
                            // Native checkboxes usually have small vertical padding
                            checkboxDiv.style.marginTop = "0.5em";
                            
                            const attrs = `class="emby-checkbox sso-link-checkbox" data-id="${link}" data-mode="${mode}" data-provider="${pName}"`;
                            checkboxDiv.innerHTML = createCheckboxHTML(link, attrs);
                            
                            subContainer.appendChild(checkboxDiv);
                        });
                    }
                });
            }).catch(err => {
                console.error("SSO Link fetch error:", err);
                container.innerHTML = `<div style="color:var(--alert-text-color, red)">Error loading links.</div>`;
            });
        },

        handleDelete: (section) => {
            const userId = ApiClient.getCurrentUserId();
            // Selector needs to target the input explicitly
            const checked = section.querySelectorAll("input.sso-link-checkbox:checked");
            const requests = Array.from(checked).map(cb => {
                const url = ApiClient.getUrl(`sso/${cb.dataset.mode.toLowerCase()}/link/${cb.dataset.provider}/${userId}/${cb.dataset.id}`);
                return ApiClient.fetch({ type: "DELETE", url: url });
            });

            Promise.all(requests).then(() => window.location.reload());
        }
    };

    const patchProfilePage = () => {
        const profilePage = document.querySelector("#userProfilePage");
        const passwordForm = profilePage?.querySelector(".updatePasswordForm");

        if (passwordForm && !document.getElementById("ssoSection")) {
            const ssoSection = document.createElement("div");
            ssoSection.id = "ssoSection";
            ssoSection.className = "detailSection";
            ssoSection.style.cssText = "margin: 2em auto; max-width: 800px;";

            // HTML for the delete confirmation checkbox
            const deleteCheckboxHtml = createCheckboxHTML(
                getTranslation("confirmDelete"), 
                `id="enable-delete-sso"`
            );

            ssoSection.innerHTML = `
                <div class="sectionTitleContainer" style="margin-bottom: 1em;">
                    <h2 class="sectionTitle">${getTranslation("ssoHeader")}</h2>
                </div>
                
                <div id="sso-oid-container" style="margin-bottom: 2em;">
                    <h3 class="inputLabel" style="margin-bottom: 0.5em; text-transform: uppercase; letter-spacing: 0.1em; font-size: 0.85em; opacity: 0.8;">${getTranslation("oidHeader")}</h3>
                    <div id="sso-oid-list"></div>
                </div>

                <div id="sso-saml-container" style="margin-bottom: 2em;">
                    <h3 class="inputLabel" style="margin-bottom: 0.5em; text-transform: uppercase; letter-spacing: 0.1em; font-size: 0.85em; opacity: 0.8;">${getTranslation("samlHeader")}</h3>
                    <div id="sso-saml-list"></div>
                </div>

                <br/>
                
                <div class="checkboxContainer checkboxContainer-withDescription">
                    ${deleteCheckboxHtml}
                </div>
                
                <div class="inputContainer">
                    <button id="btn-delete-sso" class="emby-button raised block button-delete" disabled style="background-color: var(--button-delete-background, #cc3333); color: var(--button-delete-text, white);">
                        <span>${getTranslation("deleteSelected")}</span>
                    </button>
                </div>
            `;

            passwordForm.parentNode.insertBefore(ssoSection, passwordForm.nextSibling);

            const delBtn = ssoSection.querySelector("#btn-delete-sso");
            ssoSection.querySelector("#enable-delete-sso").onchange = (e) => {
                delBtn.disabled = !e.target.checked;
                delBtn.style.opacity = e.target.checked ? "1" : "0.5";
            };
            delBtn.style.opacity = "0.5";
            delBtn.onclick = () => ssoLogic.handleDelete(ssoSection);

            ssoLogic.loadProviders(ssoSection);
        }
    };

    const patchLoginForm = () => {
        const container = document.querySelector("#loginPage .readOnlyContent");
        if (container && !document.getElementById("btnSSOLogin")) {
            const btn = document.createElement("button");
            btn.id = "btnSSOLogin";
            btn.type = "button";
            btn.className = "raised block emby-button";
            btn.style.cssText = "margin-top:1em; display:flex; align-items:center; justify-content:center; gap:0.5em; background-color:var(--theme-primary-color, #00a4dc); color: #fff;";
            btn.innerHTML = `<i class="material-icons">fingerprint</i><span>${getTranslation("login")}</span>`;
            btn.onclick = () => window.location.href = SSO_URL;
            container.prepend(btn);
        }
    };

    const observer = new MutationObserver(() => {
        patchLoginForm();
        patchProfilePage();
    });
    observer.observe(document.body, { childList: true, subtree: true });
})();
