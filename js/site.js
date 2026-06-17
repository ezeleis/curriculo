(function () {
  "use strict";

  var LANGS = ["en", "pt-BR", "es"];
  var PROFILES = ["developer", "sdr", "corretor"];
  var STORAGE_LANG = "fl-lang";
  var STORAGE_PROFILE = "fl-profile";

  var state = {
    lang: "en",
    profile: "developer",
    i18n: null,
    profileData: null,
    projects: null,
    page: "resume",
    allowedProfiles: null
  };

  function t(key) {
    var parts = key.split(".");
    var node = state.i18n;
    for (var i = 0; i < parts.length; i++) {
      if (!node || typeof node !== "object") return key;
      node = node[parts[i]];
    }
    return typeof node === "string" ? node : key;
  }

  function loc(obj) {
    if (!obj) return "";
    return obj[state.lang] || obj.en || "";
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function phoneTel(display) {
    var digits = String(display || "").replace(/\D/g, "");
    return digits ? "+" + digits : "";
  }

  function readPrefs() {
    var params = new URLSearchParams(window.location.search);
    var lang = params.get("lang");
    var profile = params.get("profile");

    var availableProfiles = getAvailableProfiles();
    var availableLangs = getAvailableLanguages();

    if (lang && availableLangs.indexOf(lang) !== -1) {
      state.lang = lang;
      try {
        localStorage.setItem(STORAGE_LANG, lang);
      } catch (e) {}
    } else {
      try {
        var storedLang = localStorage.getItem(STORAGE_LANG);
        if (storedLang && availableLangs.indexOf(storedLang) !== -1) state.lang = storedLang;
      } catch (e) {}
      if (availableLangs.indexOf(state.lang) === -1) state.lang = availableLangs[0];
    }

    if (profile && availableProfiles.indexOf(profile) !== -1) {
      state.profile = profile;
      try {
        localStorage.setItem(STORAGE_PROFILE, profile);
      } catch (e) {}
    } else {
      try {
        var storedProfile = localStorage.getItem(STORAGE_PROFILE);
        if (storedProfile && availableProfiles.indexOf(storedProfile) !== -1) state.profile = storedProfile;
      } catch (e) {}
      if (availableProfiles.indexOf(state.profile) === -1) state.profile = availableProfiles[0];
    }
  }

  function syncUrl() {
    var url = new URL(window.location.href);
    url.searchParams.set("lang", state.lang);
    url.searchParams.set("profile", state.profile);
    window.history.replaceState({}, "", url.pathname + url.search);
  }

  function fetchJson(path) {
    return fetch(path).then(function (res) {
      if (!res.ok) throw new Error("Failed to load " + path);
      return res.json();
    });
  }

  function fetchAllowedProfiles() {
    return fetch("/api/profile-access")
      .then(function (res) {
        if (!res.ok) {
          console.warn("Profile access check failed:", res.status);
          return null;
        }
        return res.json();
      })
      .then(function (data) {
        if (!data || !data.ok) {
          console.warn("Profile access response not ok:", data);
          return null;
        }
        console.log("Allowed profiles:", data.profiles);
        return data.profiles;
      })
      .catch(function (err) {
        console.warn("Profile access fetch error:", err.message);
        return null;
      });
  }

  function isProfileAllowed(profile) {
    if (state.allowedProfiles === null) return true;
    return state.allowedProfiles.indexOf(profile) !== -1;
  }

  function getAvailableProfiles() {
    if (state.allowedProfiles === null) return PROFILES;
    return PROFILES.filter(function (p) {
      return state.allowedProfiles.indexOf(p) !== -1;
    });
  }

  function getAvailableLanguages() {
    if (state.allowedProfiles === null) return LANGS;
    return LANGS.filter(function (l) {
      return state.allowedProfiles.indexOf(l) !== -1;
    });
  }

  function pdfExportBasename() {
    return "Facundo_Leis_Pou_Resume_" + state.profile + "_" + state.lang;
  }

  function pdfExportPath() {
    return "exports/" + pdfExportBasename() + ".pdf";
  }

  function pdfDownloadFilename() {
    return pdfExportBasename() + ".pdf";
  }

  function handleDownloadPdf(event) {
    event.preventDefault();
    var path = pdfExportPath();
    var filename = pdfDownloadFilename();
    fetch(path, { method: "HEAD" })
      .then(function (res) {
        if (res.ok) {
          var link = document.createElement("a");
          link.href = path;
          link.download = filename;
          link.rel = "noopener";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          return;
        }
        window.print();
      })
      .catch(function () {
        window.print();
      });
  }

  function renderHeader() {
    var header = document.querySelector(".site-header .header-inner");
    if (!header) return;

    var isWork = state.page === "work";
    var query = "?lang=" + encodeURIComponent(state.lang) + "&profile=" + encodeURIComponent(state.profile);

    var availableProfiles = getAvailableProfiles();
    var availableLangs = getAvailableLanguages();

    var profileOptions = availableProfiles.map(function (id) {
      return (
        '<option value="' +
        id +
        '"' +
        (state.profile === id ? " selected" : "") +
        ">" +
        escapeHtml(t("switcher." + id)) +
        "</option>"
      );
    }).join("");

    var langOptions = availableLangs.map(function (l) {
      var label = l === "pt-BR" ? "PT-BR" : l.toUpperCase();
      return (
        '<option value="' +
        l +
        '"' +
        (state.lang === l ? " selected" : "") +
        ">" +
        label +
        "</option>"
      );
    }).join("");

    header.innerHTML =
      '<div class="header-brand">' +
      '<p class="eyebrow">' +
      escapeHtml(t("siteName")) +
      " · GitHub Pages</p>" +
      '<nav class="site-nav" aria-label="Site">' +
      '<a class="nav-link' +
      (isWork ? "" : " is-active") +
      '" href="index.html' +
      query +
      '">' +
      escapeHtml(t("nav.resume")) +
      "</a>" +
      '<a class="nav-link' +
      (isWork ? " is-active" : "") +
      '" href="work.html' +
      query +
      '">' +
      escapeHtml(t("nav.work")) +
      "</a>" +
      '<a class="nav-link" href="index.html' +
      query +
      '#contact">' +
      escapeHtml(t("nav.contact")) +
      "</a>" +
      "</nav></div>" +
      '<div class="header-controls">' +
      (availableProfiles.length > 1 ? '<label class="control">' +
      '<span class="control-label">' +
      escapeHtml(t("switcher.profile")) +
      "</span>" +
      '<select id="profileSelect" aria-label="' +
      escapeHtml(t("switcher.profile")) +
      '">' +
      profileOptions +
      "</select></label>" : "") +
      (availableLangs.length > 1 ? '<label class="control">' +
      '<span class="control-label">' +
      escapeHtml(t("switcher.language")) +
      "</span>" +
      '<select id="langSelect" aria-label="' +
      escapeHtml(t("switcher.language")) +
      '">' +
      langOptions +
      "</select></label>" : "") +
      (isWork
        ? ""
        : '<div class="header-actions">' +
          '<a class="btn btn-ghost" id="downloadPdfBtn" href="' +
          escapeHtml(pdfExportPath()) +
          '" download="' +
          escapeHtml(pdfDownloadFilename()) +
          '">' +
          escapeHtml(t("actions.downloadPdf")) +
          "</a>" +
          '<button type="button" class="btn btn-primary" id="printBtn">' +
          escapeHtml(t("actions.printPdf")) +
          "</button></div>") +
      "</div>";

    var profileSelect = document.getElementById("profileSelect");
    var langSelect = document.getElementById("langSelect");
    var printBtn = document.getElementById("printBtn");
    var downloadPdfBtn = document.getElementById("downloadPdfBtn");

    if (profileSelect) {
      profileSelect.addEventListener("change", function () {
        state.profile = profileSelect.value;
        try {
          localStorage.setItem(STORAGE_PROFILE, state.profile);
        } catch (e) {}
        reloadPage();
      });
    }

    if (langSelect) {
      langSelect.addEventListener("change", function () {
        state.lang = langSelect.value;
        try {
          localStorage.setItem(STORAGE_LANG, state.lang);
        } catch (e) {}
        reloadPage();
      });
    }

    if (printBtn) {
      printBtn.addEventListener("click", function () {
        window.print();
      });
    }

    if (downloadPdfBtn) {
      downloadPdfBtn.addEventListener("click", handleDownloadPdf);
    }
  }

  function reloadPage() {
    syncUrl();
    var profileLoad =
      state.page === "work"
        ? Promise.resolve()
        : fetchJson("data/profiles/" + state.profile + ".json").then(function (data) {
            state.profileData = data;
          });

    var i18nLoad = fetchJson("data/i18n/" + state.lang + ".json").then(function (data) {
      state.i18n = data;
    });

    Promise.all([profileLoad, i18nLoad])
      .then(function () {
        if (state.page === "work") {
          renderWorkPage();
        } else {
          renderResumePage();
        }
        renderHeader();
        renderFooter();
        document.documentElement.lang = state.lang === "pt-BR" ? "pt-BR" : state.lang;
      })
      .catch(function (err) {
        console.error(err);
      });
  }

  function renderFooter() {
    var footer = document.querySelector(".site-footer .container");
    if (!footer) return;
    footer.innerHTML = "";
  }

  function renderResumePage() {
    var root = document.getElementById("cv-root");
    if (!root || !state.profileData) return;

    var p = state.profileData;
    var featured = (state.projects && state.projects.projects ? state.projects.projects : [])
      .filter(function (proj) {
        return proj.featured && (!proj.profiles || proj.profiles.indexOf(state.profile) !== -1);
      })
      .sort(function (a, b) {
        return (a.order || 0) - (b.order || 0);
      });

    var skillsHtml = p.skills
      .map(function (s) {
        return (
          "<li><strong>" +
          escapeHtml(loc(s.label)) +
          ":</strong> " +
          escapeHtml(loc(s.value)) +
          "</li>"
        );
      })
      .join("");

    var expHtml = p.experience
      .map(function (job) {
        var bullets = job.bullets
          .map(function (b) {
            return "<li>" + escapeHtml(loc(b)) + "</li>";
          })
          .join("");
        return (
          '<div class="job">' +
          '<div class="job-head">' +
          "<h3>" +
          escapeHtml(loc(job.title)) +
          "</h3>" +
          '<p class="org">' +
          escapeHtml(loc(job.org)) +
          "</p>" +
          '<p class="dates">' +
          escapeHtml(job.dates) +
          "</p></div><ul>" +
          bullets +
          "</ul></div>"
        );
      })
      .join("");

    var eduHtml = p.education
      .map(function (e) {
        return (
          "<p><strong>" +
          escapeHtml(loc(e.degree)) +
          "</strong><br />" +
          escapeHtml(loc(e.school)) +
          " · " +
          escapeHtml(e.dates) +
          "</p>"
        );
      })
      .join("");

    var trainRows = p.trainings && p.trainings.length > 0
      ? p.trainings
          .map(function (t) {
            var issuerAndDate = escapeHtml(loc(t.issuer)) + (t.date ? " · " + escapeHtml(t.date) : "");
            return (
              "<tr><td>" +
              escapeHtml(loc(t.name)) +
              "</td><td>" +
              issuerAndDate +
              "</td></tr>"
            );
          })
          .join("")
      : "";

    var certRows = p.certifications
      .map(function (c) {
        return (
          "<tr><td>" +
          escapeHtml(loc(c.name)) +
          "</td><td>" +
          escapeHtml(loc(c.issuer)) +
          "</td></tr>"
        );
      })
      .join("");

    var workTeaser =
      featured.length > 0
        ? '<section aria-labelledby="work-teaser-heading">' +
          "<h2 id=\"work-teaser-heading\">" +
          escapeHtml(t("sections.selectedWork")) +
          "</h2>" +
          "<ul class=\"work-teaser-list\">" +
          featured
            .slice(0, 3)
            .map(function (proj) {
              var statusLabel = t("status." + proj.status) || proj.status;
              return (
                "<li><strong>" +
                escapeHtml(loc(proj.name)) +
                "</strong> — " +
                escapeHtml(loc(proj.tagline)) +
                ' <span class="status-pill">' +
                escapeHtml(statusLabel) +
                "</span></li>"
              );
            })
            .join("") +
          "</ul>" +
          '<p class="work-teaser-cta"><a class="btn btn-ghost" href="work.html?lang=' +
          encodeURIComponent(state.lang) +
          "&profile=" +
          encodeURIComponent(state.profile) +
          '">' +
          escapeHtml(t("actions.viewWork")) +
          " →</a></p></section>"
        : "";

    var phoneLine = p.contact.phone
      ? '<a href="tel:' +
        escapeHtml(phoneTel(p.contact.phone)) +
        '">' +
        escapeHtml(p.contact.phone) +
        "</a>"
      : "";

    root.innerHTML =
      '<header class="resume-header" id="contact">' +
      "<h1>Facundo Ezequiel Leis Pou</h1>" +
      '<p class="title-line">' +
      escapeHtml(loc(p.titleLine)) +
      "</p>" +
      '<p class="meta-line">' +
      escapeHtml(loc(p.location)) +
      (phoneLine ? " · " + phoneLine : "") +
      " · " +
      '<a href="mailto:' +
      escapeHtml(p.contact.email) +
      '">' +
      escapeHtml(p.contact.email) +
      "</a> · " +
      '<a href="' +
      escapeHtml(p.contact.linkedin) +
      '" rel="noopener noreferrer">LinkedIn</a></p></header>' +
      '<hr class="rule" />' +
      '<section aria-labelledby="summary-heading"><h2 id="summary-heading">' +
      escapeHtml(t("sections.summary")) +
      "</h2><p>" +
      escapeHtml(loc(p.summary)) +
      "</p></section>" +
      workTeaser +
      '<section aria-labelledby="skills-heading"><h2 id="skills-heading">' +
      escapeHtml(t("sections.skills")) +
      '</h2><ul class="skills-grid">' +
      skillsHtml +
      "</ul></section>" +
      '<section aria-labelledby="exp-heading"><h2 id="exp-heading">' +
      escapeHtml(t("sections.experience")) +
      "</h2>" +
      expHtml +
      "</section>" +
      '<section aria-labelledby="edu-heading"><h2 id="edu-heading">' +
      escapeHtml(t("sections.education")) +
      "</h2>" +
      eduHtml +
      "</section>" +
      (trainRows ? '<section aria-labelledby="train-heading"><h2 id="train-heading">' +
      escapeHtml(t("sections.trainings")) +
      '</h2><div class="table-wrap"><table><thead><tr><th scope="col">' +
      escapeHtml(t("sections.trainings")) +
      '</th><th scope="col">Issuer / Date</th></tr></thead><tbody>' +
      trainRows +
      "</tbody></table></div></section>" : "") +
      '<section aria-labelledby="cert-heading"><h2 id="cert-heading">' +
      escapeHtml(t("sections.certifications")) +
      '</h2><p class="cert-intro">' +
      escapeHtml(p.certIntro ? loc(p.certIntro) : t("certIntro")) +
      '</p><div class="table-wrap"><table><thead><tr><th scope="col">' +
      escapeHtml(t("sections.certifications")) +
      '</th><th scope="col">Issuer / notes</th></tr></thead><tbody>' +
      certRows +
      "</tbody></table></div></section>" +
      '<footer class="resume-footer"><p><em>' +
      escapeHtml(t("sections.references")) +
      "</em></p></footer>";

    document.title = "Facundo Leis Pou — " + loc(p.titleLine);
    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        "content",
        "Facundo Ezequiel Leis Pou — " + loc(p.titleLine) + ". Resume and portfolio."
      );
    }
  }

  function renderWorkPage() {
    var root = document.getElementById("work-root");
    if (!root || !state.projects) return;

    var projects = state.projects.projects
      .filter(function (proj) {
        return !proj.profiles || proj.profiles.indexOf(state.profile) !== -1;
      })
      .sort(function (a, b) {
        return (a.order || 0) - (b.order || 0);
      });

    var cards = projects
      .map(function (proj) {
        var statusLabel = t("status." + proj.status) || proj.status;
        var demoBtn = proj.demoUrl
          ? '<a class="btn btn-primary" href="' +
            escapeHtml(proj.demoUrl) +
            '" rel="noopener noreferrer" target="_blank">' +
            escapeHtml(t("actions.playDemo")) +
            " ↗</a>"
          : '<span class="btn btn-muted" aria-disabled="true">' +
            escapeHtml(t("actions.demoSoon")) +
            "</span>";

        var stack = (proj.stack || [])
          .map(function (tag) {
            return '<span class="tag">' + escapeHtml(tag) + "</span>";
          })
          .join("");

        return (
          '<article class="project-card" id="' +
          escapeHtml(proj.id) +
          '">' +
          '<div class="project-card-head">' +
          '<p class="project-codename">' +
          escapeHtml(proj.codename) +
          "</p>" +
          "<h2>" +
          escapeHtml(loc(proj.name)) +
          "</h2>" +
          '<p class="project-tagline">' +
          escapeHtml(loc(proj.tagline)) +
          "</p>" +
          '<p class="project-status"><span class="status-pill">' +
          escapeHtml(statusLabel) +
          "</span></p></div>" +
          '<p class="project-desc">' +
          escapeHtml(loc(proj.description)) +
          "</p>" +
          '<div class="project-stack"><span class="stack-label">' +
          escapeHtml(t("work.stack")) +
          ":</span> " +
          stack +
          "</div>" +
          '<div class="project-actions">' +
          demoBtn +
          "</div></article>"
        );
      })
      .join("");

    root.innerHTML =
      '<header class="work-header">' +
      "<h1>" +
      escapeHtml(t("work.title")) +
      "</h1>" +
      '<p class="work-subtitle">' +
      escapeHtml(t("work.subtitle" + (state.profile === "corretor" ? "Corretor" : state.profile === "sdr" ? "Sdr" : ""))) +
      "</p></header>" +
      '<div class="project-grid">' +
      cards +
      "</div>";

    document.title = "Facundo Leis Pou — " + t("work.title");
  }

  function init() {
    state.page = document.body.dataset.page || "resume";

    fetchAllowedProfiles().then(function (profiles) {
      state.allowedProfiles = profiles;
      readPrefs();
      document.documentElement.lang = state.lang === "pt-BR" ? "pt-BR" : state.lang;

      var loads = [
        fetchJson("data/i18n/" + state.lang + ".json").then(function (data) {
          state.i18n = data;
        }),
        fetchJson("data/profiles/" + state.profile + ".json").then(function (data) {
          state.profileData = data;
        }),
        fetchJson("data/projects.json").then(function (data) {
          state.projects = data;
        })
      ];

      Promise.all(loads)
        .then(function () {
          syncUrl();
          renderHeader();
          if (state.page === "work") {
            renderWorkPage();
          } else {
            renderResumePage();
          }
          renderFooter();
        })
        .catch(function (err) {
          console.error(err);
          var root = document.getElementById("cv-root") || document.getElementById("work-root");
          if (root) {
            root.innerHTML =
              '<p class="error-msg">Could not load site data. Serve this folder over HTTP (e.g. <code>npx serve .</code>) rather than opening files directly.</p>';
          }
        });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
