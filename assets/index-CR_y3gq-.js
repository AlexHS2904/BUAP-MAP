(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))o(i);new MutationObserver(i=>{for(const a of i)if(a.type==="childList")for(const d of a.addedNodes)d.tagName==="LINK"&&d.rel==="modulepreload"&&o(d)}).observe(document,{childList:!0,subtree:!0});function n(i){const a={};return i.integrity&&(a.integrity=i.integrity),i.referrerPolicy&&(a.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?a.credentials="include":i.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function o(i){if(i.ep)return;i.ep=!0;const a=n(i);fetch(i.href,a)}})();const Z=[{username:"admin",password:"admin123",role:"admin",name:"Administrador"},{username:"alumno",password:"buap2024",role:"user",name:"Alumno BUAP"}],x="buap_session";function M(){try{return JSON.parse(localStorage.getItem(x))}catch{return null}}function G(e,t){const n=Z.find(i=>i.username===e&&i.password===t);if(!n)return null;const o={username:n.username,role:n.role,name:n.name};return localStorage.setItem(x,JSON.stringify(o)),o}function X(){localStorage.removeItem(x)}const N="buap_favorites";function C(){try{return JSON.parse(localStorage.getItem(N))||[]}catch{return[]}}function j(e){const t=C(),n=t.indexOf(e);return n===-1?t.push(e):t.splice(n,1),localStorage.setItem(N,JSON.stringify(t)),n===-1}function Q(e){return C().includes(e)}mapboxgl.accessToken=window.__MAPBOX_TOKEN__;const I=[[-98.2045340538025,19.00556470634405],[-98.20597171783449,19.004844482595736],[-98.20218443870544,18.99403060756469],[-98.19386959075928,18.996982682581958],[-98.193998336792,19.000827402805637],[-98.2045340538025,19.00556470634405]],V=[-98.1995,19.0001],f={aulas:{color:"#2E6B9E",label:"Aulas",emoji:"🎓"},biblioteca:{color:"#6B4E8A",label:"Biblioteca",emoji:"📚"},comida:{color:"#D4713A",label:"Comida",emoji:"🍽️"},deportivo:{color:"#4A7C59",label:"Deportivo",emoji:"⚽"},servicios:{color:"#B84040",label:"Servicios",emoji:"🏥"},admin:{color:"#C9933A",label:"Admin",emoji:"🏛️"}},W=[{id:"base-1",name:"Facultad de Ingeniería",coords:[-98.1996,19.00155],cat:"aulas",desc:"Ingenierías civil, mecánica, electrónica y más.",isBase:!0},{id:"base-2",name:"Biblioteca José M. Lafragua",coords:[-98.1982,19.00055],cat:"biblioteca",desc:"La biblioteca central del campus universitario.",isBase:!0},{id:"base-3",name:"Estadio Universitario BUAP",coords:[-98.201,18.997],cat:"deportivo",desc:"Estadio de futbol y pista de atletismo.",isBase:!0},{id:"base-4",name:"Facultad de Derecho",coords:[-98.1975,19.0018],cat:"aulas",desc:"Licenciatura y posgrado en Ciencias Jurídicas.",isBase:!0},{id:"base-5",name:"Rectoría BUAP",coords:[-98.1993,19.0025],cat:"admin",desc:"Oficinas centrales de la rectoría universitaria.",isBase:!0},{id:"base-6",name:"Facultad de Arquitectura",coords:[-98.2028,19.0035],cat:"aulas",desc:"Diseño urbano, arquitectura e interiorismo.",isBase:!0},{id:"base-7",name:"Cafetería Central",coords:[-98.2,19.0005],cat:"comida",desc:"Cafetería principal con menú del día.",isBase:!0}],F="buap_custom_pois",_="buap_base_edits";function y(){try{return JSON.parse(localStorage.getItem(F))||[]}catch{return[]}}function w(e){localStorage.setItem(F,JSON.stringify(e))}function D(){try{return JSON.parse(localStorage.getItem(_))||{}}catch{return{}}}function ee(e){localStorage.setItem(_,JSON.stringify(e))}function S(){const e=D();return[...W.map(n=>e[n.id]?{...n,...e[n.id]}:n),...y()]}function te(){return"poi-"+Date.now()+"-"+Math.random().toString(36).slice(2,6)}let m=null,L=null,l=null,p=[],v=!1;const s=new mapboxgl.Map({container:"map",style:"mapbox://styles/mapbox/streets-v12",center:V,zoom:15.8,pitch:0,bearing:0,antialias:!0,maxZoom:19,minZoom:13,dragRotate:!0,touchPitch:!0});s.dragRotate.enable();s.touchZoomRotate&&s.touchZoomRotate.enableRotation&&s.touchZoomRotate.enableRotation();async function k(e,t){const n=`https://api.mapbox.com/directions/v5/mapbox/walking/${e[0]},${e[1]};${t[0]},${t[1]}?geometries=geojson&overview=full&access_token=${mapboxgl.accessToken}`,i=await(await fetch(n)).json();if(!i.routes?.length)return g("No se encontró ruta. Intenta acercarte al campus."),null;const a=i.routes[0],d=Math.ceil(a.duration/60),c=(a.distance/1e3).toFixed(2);return s.getSource("route")?s.getSource("route").setData({type:"Feature",geometry:a.geometry}):(s.addSource("route",{type:"geojson",data:{type:"Feature",geometry:a.geometry}}),s.addLayer({id:"route-shadow",type:"line",source:"route",layout:{"line-join":"round","line-cap":"round"},paint:{"line-color":"#000","line-width":8,"line-opacity":.1,"line-blur":4}}),s.addLayer({id:"route-line",type:"line",source:"route",layout:{"line-join":"round","line-cap":"round"},paint:{"line-color":"#2E6B9E","line-width":5,"line-opacity":.9}})),{duration:d,distance:c}}function R(){["route-line","route-shadow"].forEach(e=>{s.getLayer(e)&&s.removeLayer(e)}),s.getSource("route")&&s.removeSource("route"),l=null,ne()}function P({destName:e,duration:t,distance:n,mode:o}){document.getElementById("nav-dest").textContent=e,document.getElementById("nav-duration").textContent=`🚶 ${t} min`,document.getElementById("nav-distance").textContent=`📍 ${n} km`,document.getElementById("nav-mode-label").textContent=o==="user"?"Desde tu ubicación":"Ruta entre puntos",document.getElementById("nav-bar").classList.add("open")}function ne(){document.getElementById("nav-bar").classList.remove("open")}function g(e){const t=document.getElementById("nav-error");t.textContent=e,t.classList.add("show"),setTimeout(()=>t.classList.remove("show"),3500)}function H(e){if(L){L.setLngLat(e);return}const t=document.createElement("div");t.style.cssText=`
    width:18px;
    height:18px;
    border-radius:50%;
    background:#1A73E8;
    border:3px solid white;
    box-shadow:0 0 0 5px rgba(26,115,232,0.2);
  `,L=new mapboxgl.Marker({element:t,anchor:"center"}).setLngLat(e).addTo(s)}function q(){const e=document.getElementById("login-overlay");e&&e.remove();const t=document.createElement("div");t.id="login-overlay",t.innerHTML=`
    <div class="login-card">
      <div class="login-logo">🏛️</div>
      <h1 class="login-title">BUAP Campus</h1>
      <p class="login-sub">Inicia sesión para continuar</p>

      <div class="login-field">
        <label>Usuario</label>
        <input id="login-user" type="text" placeholder="usuario" autocomplete="username" />
      </div>
      <div class="login-field">
        <label>Contraseña</label>
        <input id="login-pass" type="password" placeholder="••••••••" autocomplete="current-password" />
      </div>
      <div id="login-error" class="login-error"></div>
      <button id="login-btn" class="login-btn">Entrar</button>

      <div class="login-hint">
        <span>admin / admin123</span>
        <span>alumno / buap2024</span>
      </div>
    </div>
  `,document.body.appendChild(t);const n=()=>{const o=document.getElementById("login-user").value.trim(),i=document.getElementById("login-pass").value,a=G(o,i);if(!a){document.getElementById("login-error").textContent="Usuario o contraseña incorrectos.";return}t.classList.add("fade-out"),setTimeout(()=>{t.remove(),U(a)},400)};document.getElementById("login-btn").addEventListener("click",n),document.getElementById("login-pass").addEventListener("keydown",o=>{o.key==="Enter"&&n()})}function oe(e){const t=document.getElementById("user-bar");t&&t.remove();const n=document.createElement("div");n.id="user-bar",n.innerHTML=`
    <span class="user-bar-name">${e.role==="admin"?"⚙️":"👤"} ${e.name}</span>
    ${e.role==="admin"?'<button id="btn-admin-mode" class="user-bar-btn admin-btn" title="Modo agregar POI">＋ POI</button>':""}
    <button id="btn-favorites-open" class="user-bar-btn fav-btn" title="Favoritos">★</button>
    <button id="btn-logout" class="user-bar-btn logout-btn" title="Cerrar sesión">↩</button>
  `,document.body.appendChild(n),document.getElementById("btn-logout").addEventListener("click",()=>{X(),p.forEach(({marker:i,observer:a})=>{a&&a.disconnect(),i.remove()}),p=[],R(),q(),n.remove();const o=document.getElementById("fav-panel");o&&o.remove()}),document.getElementById("btn-favorites-open").addEventListener("click",()=>{ae()}),e.role==="admin"&&document.getElementById("btn-admin-mode").addEventListener("click",()=>{v=!v;const o=document.getElementById("btn-admin-mode");v?(o.classList.add("active"),o.textContent="✕ Cancelar",s.getCanvas().style.cursor="crosshair",g("Haz clic en el mapa para agregar un POI")):(o.classList.remove("active"),o.textContent="＋ POI",s.getCanvas().style.cursor="")})}function ae(){const e=document.getElementById("fav-panel");if(e){e.classList.toggle("open");return}const t=document.createElement("div");t.id="fav-panel",t.innerHTML=`
    <div class="panel-handle"></div>
    <button class="panel-close" id="fav-panel-close">×</button>
    <h2 class="fav-title">★ Mis Favoritos</h2>
    <div id="fav-list"></div>
  `,document.body.appendChild(t),document.getElementById("fav-panel-close").addEventListener("click",()=>{t.classList.remove("open")}),setTimeout(()=>t.classList.add("open"),10),T(t)}function T(e){const t=e?e.querySelector("#fav-list"):document.getElementById("fav-list");if(!t)return;const n=C(),o=S();if(n.length===0){t.innerHTML='<p class="fav-empty">Aún no tienes favoritos.<br>Toca ★ en cualquier lugar.</p>';return}t.innerHTML="",n.forEach(i=>{const a=o.find(r=>r.name===i);if(!a)return;const d=f[a.cat]||{color:"#A8956A",emoji:"📍"},c=document.createElement("div");c.className="fav-item",c.innerHTML=`
      <span class="fav-item-emoji" style="background:${d.color}">${d.emoji}</span>
      <div class="fav-item-info">
        <div class="fav-item-name">${a.name}</div>
        <div class="fav-item-cat">${d.label||a.cat}</div>
      </div>
      <button class="fav-item-remove" data-name="${a.name}" title="Quitar">✕</button>
    `,c.querySelector(".fav-item-remove").addEventListener("click",r=>{r.stopPropagation(),j(a.name),T(null);const u=document.getElementById("panel-fav-btn");u&&document.getElementById("panel-name").textContent===a.name&&(u.textContent="☆ Favorito",u.classList.remove("active"))}),c.addEventListener("click",r=>{r.target.classList.contains("fav-item-remove")||(s.flyTo({center:a.coords,zoom:17,pitch:45,bearing:s.getBearing(),duration:800}),document.getElementById("fav-panel").classList.remove("open"))}),t.appendChild(c)})}function ie(e){const t=document.getElementById("add-poi-modal");t&&t.remove();const n=document.createElement("div");n.id="add-poi-modal",n.innerHTML=`
    <div class="add-poi-card">
      <h3 class="add-poi-title">Nuevo POI</h3>
      <p class="add-poi-coords">📍 ${e[1].toFixed(5)}, ${e[0].toFixed(5)}</p>

      <div class="login-field">
        <label>Nombre</label>
        <input id="poi-input-name" type="text" placeholder="Ej: Sala de Cómputo B" />
      </div>

      <div class="login-field">
        <label>Descripción</label>
        <input id="poi-input-desc" type="text" placeholder="Breve descripción" />
      </div>

      <div class="login-field">
        <label>Categoría</label>
        <select id="poi-input-cat">
          ${Object.entries(f).map(([o,i])=>`<option value="${o}">${i.emoji} ${i.label}</option>`).join("")}
        </select>
      </div>

      <div class="add-poi-btns">
        <button id="poi-save-btn" class="login-btn">Guardar</button>
        <button id="poi-cancel-btn" class="login-btn secondary">Cancelar</button>
      </div>
    </div>
  `,document.body.appendChild(n),setTimeout(()=>n.classList.add("open"),10),document.getElementById("poi-cancel-btn").addEventListener("click",()=>{n.classList.remove("open"),setTimeout(()=>n.remove(),300),v=!1;const o=document.getElementById("btn-admin-mode");o&&(o.classList.remove("active"),o.textContent="＋ POI"),s.getCanvas().style.cursor=""}),document.getElementById("poi-save-btn").addEventListener("click",()=>{const o=document.getElementById("poi-input-name").value.trim(),i=document.getElementById("poi-input-desc").value.trim(),a=document.getElementById("poi-input-cat").value;if(!o){document.getElementById("poi-input-name").style.borderColor="#B84040";return}const d={id:te(),name:o,desc:i||"Sin descripción.",cat:a,coords:e},c=y();c.push(d),w(c),n.classList.remove("open"),setTimeout(()=>n.remove(),300),v=!1;const r=document.getElementById("btn-admin-mode");r&&(r.classList.remove("active"),r.textContent="＋ POI"),s.getCanvas().style.cursor="",$(d),g(`✅ POI "${o}" agregado`)})}function se(e){const t=document.getElementById("edit-poi-modal");t&&t.remove();const n=document.createElement("div");n.id="edit-poi-modal",n.innerHTML=`
    <div class="add-poi-card">
      <h3 class="add-poi-title">✏️ Editar POI</h3>

      ${e.isBase?'<p class="add-poi-coords" style="color:#C9933A">⚠️ POI base — solo se editan nombre, descripción y categoría</p>':`<p class="add-poi-coords">📍 ${e.coords[1].toFixed(5)}, ${e.coords[0].toFixed(5)}</p>`}

      <div class="login-field">
        <label>Nombre</label>
        <input id="edit-poi-name" type="text" value="${e.name}" />
      </div>

      <div class="login-field">
        <label>Descripción</label>
        <input id="edit-poi-desc" type="text" value="${e.desc}" />
      </div>

      <div class="login-field">
        <label>Categoría</label>
        <select id="edit-poi-cat">
          ${Object.entries(f).map(([i,a])=>`<option value="${i}" ${e.cat===i?"selected":""}>${a.emoji} ${a.label}</option>`).join("")}
        </select>
      </div>

      <div class="add-poi-btns">
        <button id="edit-poi-save" class="login-btn">Guardar cambios</button>
        <button id="edit-poi-cancel" class="login-btn secondary">Cancelar</button>
      </div>
    </div>
  `,document.body.appendChild(n),setTimeout(()=>n.classList.add("open"),10);const o=()=>{n.classList.remove("open"),setTimeout(()=>n.remove(),300)};document.getElementById("edit-poi-cancel").addEventListener("click",o),document.getElementById("edit-poi-save").addEventListener("click",()=>{const i=document.getElementById("edit-poi-name").value.trim(),a=document.getElementById("edit-poi-desc").value.trim(),d=document.getElementById("edit-poi-cat").value;if(!i){document.getElementById("edit-poi-name").style.borderColor="#B84040";return}if(e.isBase){const c=D();c[e.id]={name:i,desc:a||e.desc,cat:d},ee(c)}else{const c=y(),r=c.findIndex(u=>u.id===e.id);r!==-1&&(c[r]={...c[r],name:i,desc:a||e.desc,cat:d},w(c))}o(),ce(e.id??e.name,{name:i,desc:a||e.desc,cat:d}),g(`✅ POI "${i}" actualizado`)})}function de(e){const t=document.getElementById("confirm-modal");t&&t.remove();const n=document.createElement("div");n.id="confirm-modal",n.innerHTML=`
    <div class="add-poi-card">
      <h3 class="add-poi-title" style="color:#B84040">🗑️ Eliminar POI</h3>

      <p class="add-poi-coords" style="font-size:14px;color:rgba(59,42,26,0.7);font-family:inherit;margin-bottom:20px">
        ¿Seguro que quieres eliminar <strong>${e.name}</strong>? Esta acción no se puede deshacer.
      </p>

      <div class="add-poi-btns">
        <button id="confirm-delete-yes" class="login-btn" style="background:#B84040">Sí, eliminar</button>
        <button id="confirm-delete-no"  class="login-btn secondary">Cancelar</button>
      </div>
    </div>
  `,document.body.appendChild(n),setTimeout(()=>n.classList.add("open"),10);const o=()=>{n.classList.remove("open"),setTimeout(()=>n.remove(),300)};document.getElementById("confirm-delete-no").addEventListener("click",o),document.getElementById("confirm-delete-yes").addEventListener("click",()=>{const i=y().filter(d=>d.id!==e.id);w(i);const a=p.findIndex(d=>(d.poi.id??d.poi.name)===(e.id??e.name));if(a!==-1){const{marker:d}=p[a];d.remove(),p.splice(a,1)}document.getElementById("detail-panel").classList.remove("open"),o(),g(`🗑️ POI "${e.name}" eliminado`)})}function ce(e,t){const n=p.findIndex(d=>(d.poi.id??d.poi.name)===e);if(n===-1)return;const o=p[n];o.marker.remove(),p.splice(n,1);const i={...o.poi,...t};$(i);const a=document.getElementById("panel-name");if(document.getElementById("detail-panel").classList.contains("open")&&a.textContent===o.poi.name){const d=f[t.cat]||f[o.poi.cat];a.textContent=t.name,document.getElementById("panel-desc").textContent=t.desc,document.getElementById("panel-badge").textContent=d.label,document.getElementById("panel-badge").style.background=d.color,l=i}}function $(e){const t=f[e.cat]||{color:"#A8956A",label:"Lugar",emoji:"📍"},n=document.createElement("div");n.style.cssText=`
    position:absolute;
    display:flex;
    flex-direction:column;
    align-items:center;
    cursor:pointer;
    width:0;
    height:0;
    overflow:visible;
  `;const o=document.createElement("div");o.textContent=e.name,o.style.cssText=`
    position: absolute;
    bottom: 48px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(15, 30, 53, 0.88);
    color: #E8F0FF;
    font-family: 'DM Sans', system-ui, sans-serif;
    font-size: 11px;
    font-weight: 600;
    white-space: nowrap;
    padding: 4px 9px;
    border-radius: 8px;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.18s ease, bottom 0.18s ease;
    box-shadow: 0 2px 8px rgba(0,0,0,0.35);
    letter-spacing: 0.02em;
  `;const i=document.createElement("div");i.style.cssText=`
    position: absolute;
    width: 40px;
    height: 40px;
    left: -20px;
    bottom: 0;
    border-radius: 50%;
    background: ${t.color};
    border: 3px solid white;
    box-shadow: 0 3px 10px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: box-shadow 0.2s, transform 0.2s;
  `,i.dataset.cat=e.cat;const a=document.createElement("div");a.style.cssText=`
    font-size:16px;
    line-height:1;
    user-select:none;
  `,a.textContent=t.emoji,i.appendChild(a),n.appendChild(o),n.appendChild(i),n.addEventListener("mouseenter",()=>{i.style.transform="scale(1.15)",i.style.boxShadow=`0 6px 18px ${t.color}99`,o.style.opacity="1",o.style.bottom="52px"}),n.addEventListener("mouseleave",()=>{i.style.transform="scale(1)",i.style.boxShadow="0 3px 10px rgba(0,0,0,0.3)",o.style.opacity="0",o.style.bottom="48px"});const d=document.getElementById("detail-panel"),c=document.getElementById("panel-name"),r=document.getElementById("panel-desc"),u=document.getElementById("panel-badge");n.addEventListener("click",()=>{c.textContent=e.name,r.textContent=e.desc,u.textContent=t.label,u.style.background=t.color,l=e,document.getElementById("btn-nav-user").style.display=m?"flex":"none",d.classList.add("open");const K=M(),E=document.getElementById("panel-admin-actions");if(E)if(K?.role==="admin"){E.style.display="flex";const b=document.getElementById("btn-poi-delete");b&&(b.style.display=e.isBase?"none":"flex")}else E.style.display="none";const B=document.getElementById("panel-fav-btn");if(B){const b=Q(e.name);B.textContent=b?"★ En favoritos":"☆ Favorito",B.classList.toggle("active",b)}});const A=new mapboxgl.Marker({element:n,anchor:"bottom"}).setLngLat(e.coords).addTo(s);return p.push({el:n,elPin:i,poi:e,marker:A}),{el:n,elPin:i,poi:e,marker:A}}function U(e){oe(e);const t=()=>{S().forEach(a=>$(a)),document.querySelectorAll(".chip").forEach(a=>{a.addEventListener("click",()=>{document.querySelectorAll(".chip").forEach(c=>c.classList.remove("active")),a.classList.add("active");const d=a.dataset.cat;p.forEach(({el:c,elPin:r,poi:u})=>{c.style.display=d==="all"||d===u.cat?"flex":"none"})})})};s.loaded()?t():s.once("load",t);const n=document.getElementById("panel-fav-btn");n&&n.addEventListener("click",()=>{const a=document.getElementById("panel-name").textContent,d=j(a);n.textContent=d?"★ En favoritos":"☆ Favorito",n.classList.toggle("active",d),document.getElementById("fav-panel")?.classList.contains("open")&&T(null)});const o=document.getElementById("btn-poi-edit"),i=document.getElementById("btn-poi-delete");o&&o.addEventListener("click",()=>{l&&(document.getElementById("detail-panel").classList.remove("open"),se(l))}),i&&i.addEventListener("click",()=>{l&&(document.getElementById("detail-panel").classList.remove("open"),de(l))}),s.on("click",a=>{v&&ie([a.lngLat.lng,a.lngLat.lat])})}s.on("load",()=>{["poi-label","airport-label","transit-label"].forEach(t=>{s.getLayer(t)&&s.setLayoutProperty(t,"visibility","none")}),s.addSource("campus",{type:"geojson",data:"/BUAP-MAP/data/buap.geojson"}),s.addLayer({id:"campus-ground",type:"fill",source:"campus",paint:{"fill-color":"#D6E8C0","fill-opacity":.55}}),s.addLayer({id:"campus-border",type:"line",source:"campus",paint:{"line-color":"#8B6914","line-width":3,"line-opacity":.8}}),s.addLayer({id:"campus-glow",type:"line",source:"campus",paint:{"line-color":"#C9933A","line-width":10,"line-opacity":.15,"line-blur":8}}),s.addSource("mask",{type:"geojson",data:{type:"Feature",geometry:{type:"Polygon",coordinates:[[[-180,-90],[-180,90],[180,90],[180,-90],[-180,-90]],[...I].reverse()]}}}),s.addLayer({id:"outside-mask",type:"fill",source:"mask",paint:{"fill-color":"#F0EBE0","fill-opacity":.55}});const e=new mapboxgl.LngLatBounds;I.forEach(t=>e.extend(t)),s.fitBounds(e,{padding:50,pitch:0,bearing:0,duration:1200})});document.querySelector(".panel-btn.primary").addEventListener("click",async()=>{if(!l)return;const e=async()=>{document.getElementById("detail-panel").classList.remove("open");const t=await k(m,l.coords);if(!t)return;P({destName:l.name,...t,mode:"user"});const n=new mapboxgl.LngLatBounds().extend(m).extend(l.coords);s.fitBounds(n,{padding:80,pitch:45,bearing:s.getBearing(),duration:900})};if(m){e();return}if(!navigator.geolocation){g("Tu navegador no soporta geolocalización.");return}g("Obteniendo tu ubicación…"),navigator.geolocation.getCurrentPosition(t=>{m=[t.coords.longitude,t.coords.latitude],H(m),document.getElementById("btn-nav-user").style.display="flex",e()},()=>g("No se pudo obtener tu ubicación. Revisa los permisos."),{enableHighAccuracy:!0})});document.getElementById("btn-nav-user").addEventListener("click",async()=>{if(!l||!m)return;document.getElementById("detail-panel").classList.remove("open");const e=await k(m,l.coords);if(!e)return;P({destName:l.name,...e,mode:"user"});const t=new mapboxgl.LngLatBounds().extend(m).extend(l.coords);s.fitBounds(t,{padding:80,pitch:45,bearing:s.getBearing(),duration:900})});document.getElementById("btn-nav-poi").addEventListener("click",()=>{l&&(document.getElementById("detail-panel").classList.remove("open"),le(l))});document.getElementById("panel-close").addEventListener("click",()=>{document.getElementById("detail-panel").classList.remove("open")});document.getElementById("nav-bar-close").addEventListener("click",R);document.getElementById("btn-location").addEventListener("click",()=>{if(!navigator.geolocation){g("Tu navegador no soporta geolocalización.");return}navigator.geolocation.getCurrentPosition(e=>{m=[e.coords.longitude,e.coords.latitude],H(m),s.flyTo({center:m,zoom:16.5,pitch:45,bearing:s.getBearing(),duration:900}),document.getElementById("btn-nav-user").style.display="flex"},()=>g("No se pudo obtener tu ubicación. Revisa los permisos."),{enableHighAccuracy:!0})});const h=document.getElementById("detail-panel");let z=0;h.addEventListener("touchstart",e=>{z=e.touches[0].clientY},{passive:!0});h.addEventListener("touchend",e=>{e.changedTouches[0].clientY-z>60&&h.classList.remove("open")});document.getElementById("poi-selector-close").addEventListener("click",()=>{document.getElementById("poi-selector").classList.remove("open")});function J(e=0,t=0){const n=new mapboxgl.LngLatBounds;I.forEach(o=>n.extend(o)),s.fitBounds(n,{padding:50,pitch:e,bearing:t,duration:900})}document.getElementById("btn-campus").addEventListener("click",()=>{J(45,-15)});document.getElementById("btn-top").addEventListener("click",()=>{J(0,0)});document.getElementById("btn-rotate").addEventListener("click",()=>{s.easeTo({bearing:s.getBearing()+90,pitch:s.getPitch()||45,duration:900})});function le(e){const t=document.getElementById("poi-selector"),n=document.getElementById("poi-selector-list");n.innerHTML="",S().forEach(o=>{if(o.name===e.name)return;const i=f[o.cat],a=document.createElement("button");a.className="poi-selector-item",a.innerHTML=`
      <span style="font-size:20px">${i.emoji}</span>
      <span>${o.name}</span>
    `,a.addEventListener("click",async()=>{t.classList.remove("open");const d=await k(o.coords,e.coords);if(!d)return;P({destName:e.name,...d,mode:"poi"});const c=new mapboxgl.LngLatBounds().extend(o.coords).extend(e.coords);s.fitBounds(c,{padding:80,pitch:45,bearing:s.getBearing(),duration:900})}),n.appendChild(a)}),t.classList.add("open")}const Y=[{id:"add-poi-modal",close:()=>{document.getElementById("add-poi-modal")?.classList.remove("open"),v=!1;const e=document.getElementById("btn-admin-mode");e&&(e.classList.remove("active"),e.textContent="＋ POI"),s.getCanvas().style.cursor=""}},{id:"edit-poi-modal",close:()=>document.getElementById("edit-poi-modal")?.classList.remove("open")},{id:"confirm-modal",close:()=>document.getElementById("confirm-modal")?.classList.remove("open")},{id:"poi-selector",close:()=>document.getElementById("poi-selector").classList.remove("open")},{id:"fav-panel",close:()=>document.getElementById("fav-panel")?.classList.remove("open")},{id:"detail-panel",close:()=>document.getElementById("detail-panel").classList.remove("open")}];document.addEventListener("keydown",e=>{if(e.key==="Escape"){for(const{id:t,close:n}of Y)if(document.getElementById(t)?.classList.contains("open")){n();return}}});document.addEventListener("pointerdown",e=>{for(const{id:t,close:n}of Y){const o=document.getElementById(t);if(o?.classList.contains("open")){if(["add-poi-modal","edit-poi-modal","confirm-modal"].includes(t)){if(!o.querySelector(".add-poi-card")?.contains(e.target)){n();return}}else if(!o.contains(e.target)){n();return}}}});const O=M();O?U(O):q();
