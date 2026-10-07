(() => {
  const burger = document.querySelector(".burger");
  const nav = document.getElementById("nav");
  if (burger && nav) {
    const fermer = () => {
      nav.classList.remove("ouvert");
      burger.setAttribute("aria-expanded", "false");
      burger.setAttribute("aria-label", "Ouvrir le menu");
      document.body.classList.remove("menu-ouvert");
    };
    burger.addEventListener("click", () => {
      const ouvert = nav.classList.toggle("ouvert");
      burger.setAttribute("aria-expanded", String(ouvert));
      burger.setAttribute("aria-label", ouvert ? "Fermer le menu" : "Ouvrir le menu");
      document.body.classList.toggle("menu-ouvert", ouvert);
    });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") fermer(); });
    window.matchMedia("(min-width: 1080px)").addEventListener("change", fermer);
  }

  document.querySelectorAll(".nav__ouvrir").forEach((b) => {
    b.addEventListener("click", () => b.setAttribute("aria-expanded", String(b.getAttribute("aria-expanded") !== "true")));
  });
  document.addEventListener("click", (e) => {
    document.querySelectorAll('.nav__ouvrir[aria-expanded="true"]').forEach((b) => {
      if (!b.parentElement.contains(e.target)) b.setAttribute("aria-expanded", "false");
    });
  });

  const zone = document.querySelector("[data-filtrable]");
  if (zone) {
    const boutons = [...zone.querySelectorAll(".filtre")];
    const items = [...zone.querySelectorAll("[data-cat]")];
    const appliquer = (cle) => {
      if (!boutons.some((b) => b.dataset.filtre === cle)) cle = "";
      boutons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.filtre === cle)));
      items.forEach((i) => i.classList.toggle("masque", cle !== "" && i.dataset.cat !== cle));
    };
    boutons.forEach((b) => b.addEventListener("click", () => {
      appliquer(b.dataset.filtre);
      history.replaceState(null, "", b.dataset.filtre ? "#" + b.dataset.filtre : location.pathname);
    }));
    const depuisAncre = () => {
      const h = decodeURIComponent(location.hash.slice(1));
      if (h && boutons.some((b) => b.dataset.filtre === h)) appliquer(h);
    };
    depuisAncre();
    window.addEventListener("hashchange", depuisAncre);
  }

  const vis = document.querySelector(".visionneuse");
  if (vis) {
    const cible = vis.querySelector(".visionneuse__photos");
    const compteur = vis.querySelector(".visionneuse__compteur");
    const precedent = vis.querySelector(".visionneuse__prec");
    const suivant = vis.querySelector(".visionneuse__suiv");
    let diapos = [];
    let rang = 0;
    const montrer = () => {
      const grande = diapos[rang].cloneNode(true);
      grande.removeAttribute("class");
      grande.sizes = "90vw";
      grande.loading = "eager";
      cible.replaceChildren(grande);
      compteur.textContent = `${rang + 1} / ${diapos.length}`;
      // précharge la photo suivante pour un défilement sans attente
      const apres = diapos[(rang + 1) % diapos.length];
      if (apres && apres !== diapos[rang]) { const p = apres.cloneNode(true); p.sizes = "90vw"; p.loading = "eager"; }
    };
    const diaporama = (images, depart = 0) => {
      if (!images.length) return false;
      diapos = images;
      rang = depart;
      vis.classList.toggle("visionneuse--unique", images.length < 2);
      montrer();
      if (!vis.open) vis.showModal();
      return true;
    };
    const aller = (pas) => {
      if (diapos.length < 2) return;
      rang = (rang + pas + diapos.length) % diapos.length;
      montrer();
    };
    precedent.addEventListener("click", () => aller(-1));
    suivant.addEventListener("click", () => aller(1));
    vis.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") aller(1);
      if (e.key === "ArrowLeft") aller(-1);
    });
    let debutX = null;
    vis.addEventListener("touchstart", (e) => { debutX = e.touches[0].clientX; }, { passive: true });
    vis.addEventListener("touchend", (e) => {
      if (debutX === null) return;
      const dx = e.changedTouches[0].clientX - debutX;
      if (Math.abs(dx) > 50) aller(dx < 0 ? 1 : -1);
      debutX = null;
    });
    const ouvrir = (id) => {
      const t = document.getElementById("galerie-" + id);
      if (!t) return false;
      return diaporama([...t.content.querySelectorAll("img")]);
    };
    document.querySelectorAll(".agrandir").forEach((b) => b.addEventListener("click", () => {
      const groupe = b.closest("ul, .galerie3") || b.parentElement;
      const images = [...groupe.querySelectorAll(".agrandir img")];
      diaporama(images, Math.max(0, images.indexOf(b.querySelector("img"))));
    }));
    document.querySelectorAll("[data-galerie]").forEach((b) => b.addEventListener("click", () => ouvrir(b.dataset.galerie)));
    const depuisAncre = () => {
      const id = decodeURIComponent(location.hash.slice(1));
      document.querySelectorAll(".repere").forEach((e) => e.classList.remove("repere"));
      if (id && ouvrir(id)) return;
      if (vis.open) vis.close();
      if (id) document.getElementById(id)?.classList.add("repere");
    };
    depuisAncre();
    window.addEventListener("hashchange", depuisAncre);
    vis.querySelector(".visionneuse__fermer").addEventListener("click", () => vis.close());
    vis.addEventListener("click", (e) => { if (e.target === vis) vis.close(); });
  }

  const form = document.getElementById("form-devis");
  if (form) {
    const erreur = form.querySelector(".form__erreur");
    const valider = () => {
      let premier = null;
      form.querySelectorAll(".invalide").forEach((el) => el.classList.remove("invalide"));
      form.querySelectorAll("input[required], select[required], textarea[required]").forEach((el) => {
        if (!el.checkValidity()) {
          el.classList.add("invalide");
          premier ||= el;
        }
      });
      if (premier) {
        premier.closest(".champ")?.scrollIntoView({ behavior: "smooth", block: "center" });
        premier.focus({ preventScroll: true });
      }
      return !premier;
    };
    form.addEventListener("change", (e) => {
      e.target.classList.remove("invalide");
      e.target.closest(".invalide")?.classList.remove("invalide");
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      erreur.hidden = true;
      if (!valider()) return;
      const bouton = form.querySelector('button[type="submit"]');
      bouton.disabled = true;
      try {
        const rep = await fetch(form.action, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } });
        if (!rep.ok) throw new Error(rep.status);
        form.hidden = true;
        const merci = document.getElementById("merci");
        merci.hidden = false;
        merci.focus();
        merci.scrollIntoView({ behavior: "smooth", block: "center" });
      } catch {
        erreur.hidden = false;
        bouton.disabled = false;
      }
    });
  }
})();
