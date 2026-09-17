document.addEventListener("DOMContentLoaded", () => {
  if (typeof gsap !== 'undefined') {
    gsap.to(".loader-progress", { width: "70%", duration: 0.6, ease: "power1.out" });
  }

  const hidePreloader = () => {
    if (typeof gsap !== 'undefined') {
      const tl = gsap.timeline();
      tl.to(".loader-progress", { width: "100%", duration: 0.4, ease: "power2.out" })
        .to(".preloader", {
          y: "-100%",
          duration: 0.8,
          ease: "power4.inOut",
          onComplete: () => {
            document.getElementById('preloader').style.display = 'none';
          }
        })
        .from(".reveal-text", { y: 50, opacity: 0, stagger: 0.1, duration: 0.8 }, "-=0.3");
    } else {
      const bar = document.querySelector(".loader-progress");
      const pre = document.getElementById("preloader");
      if (bar) bar.style.width = "100%";
      setTimeout(() => {
        if (pre) { pre.style.opacity = "0"; pre.style.visibility = "hidden"; }
      }, 600);
    }
  };

  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    hidePreloader();
  };

  window.addEventListener("load", finish);
  // PERF FIX: was 2500ms — on slow mobile connections this kept people staring
  // at the loader way longer than needed. 1200ms safety net feels snappier
  // while still giving fonts/images a moment to settle.
  setTimeout(finish, 1200);
});

// PERF FIX: detect once whether this is a real mouse (hover-capable, fine
// pointer) device. Touch devices never benefit from the custom cursor or
// the magnetic hover effect, so we skip attaching ALL of those listeners
// entirely on mobile — this was pure wasted JS/paint work on phones before.
const isPointerDevice = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

// 2. Cursor (Hero / About / Services all sit under this - desktop only now)
if (isPointerDevice) {
  const cursor = document.querySelector('.cursor');
  const cursorDot = document.querySelector('.cursor-dot');
  if (cursor && cursorDot) {
      document.addEventListener('mousemove', (e) => {
          gsap.to(cursorDot, { x: e.clientX, y: e.clientY, duration: 0 });
          gsap.to(cursor, { x: e.clientX, y: e.clientY, duration: 0.15 });
      });
  }
}

// 3. Magnetic Logic (used by Hero buttons/socials, nav links, filter/load-more btns)
if (isPointerDevice) {
  const cursorEl = document.querySelector('.cursor');
  const magneticElements = document.querySelectorAll('.magnetic');
  magneticElements.forEach(elem => {
      elem.addEventListener('mouseenter', () => { if (cursorEl) cursorEl.classList.add('active'); });
      elem.addEventListener('mouseleave', () => {
          if (cursorEl) cursorEl.classList.remove('active');
          gsap.to(elem, { x: 0, y: 0, duration: 0.3 });
      });
      elem.addEventListener('mousemove', (e) => {
          const rect = elem.getBoundingClientRect();
          const x = (e.clientX - rect.left - rect.width / 2) * 0.4;
          const y = (e.clientY - rect.top - rect.height / 2) * 0.4;
          gsap.to(elem, { x: x, y: y, duration: 0.3 });
      });
  });
}

/* ===================== SERVICES SECTION START (JS) ===================== */
// 4. Infinite Carousel
const track = document.querySelector('.carousel-track');
if (track) {
    const cards = Array.from(track.children);
    cards.forEach(card => track.appendChild(card.cloneNode(true)));
    let carouselAnim = gsap.to(track, { xPercent: -50, ease: "none", duration: 25, repeat: -1 });
    track.addEventListener('mouseenter', () => carouselAnim.pause());
    track.addEventListener('mouseleave', () => carouselAnim.play());

    // PERF FIX: this animation used to run forever in the background even
    // when the Services section was scrolled way out of view, burning CPU
    // the whole time the page was open. Now it pauses off-screen and
    // resumes only while actually visible.
    const carouselContainer = document.querySelector('.carousel-container');
    if (carouselContainer && 'IntersectionObserver' in window) {
        const carouselObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    carouselAnim.play();
                } else {
                    carouselAnim.pause();
                }
            });
        }, { threshold: 0.05 });
        carouselObserver.observe(carouselContainer);
    }
}
/* ===================== SERVICES SECTION END (JS) ===================== */

// 5. Theme & Mobile Menu
const toggleBtn = document.getElementById('theme-toggle');
if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
        const body = document.documentElement;
        const isDark = body.getAttribute('data-theme') === 'dark';
        body.setAttribute('data-theme', isDark ? 'light' : 'dark');
        toggleBtn.querySelector('i').classList.replace(isDark ? 'fa-moon' : 'fa-sun', isDark ? 'fa-sun' : 'fa-moon');
    });
}

const menuToggle = document.getElementById('mobile-menu');
const navLinksContainer = document.querySelector('.nav-links');
if (menuToggle && navLinksContainer) {
    menuToggle.addEventListener('click', () => navLinksContainer.classList.toggle('active'));
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => navLinksContainer.classList.remove('active'));
    });
}

// GSAP ScrollTrigger
if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);

    /* ===================== ABOUT SECTION START (JS) ===================== */
    // Image Reveal
    if (document.querySelector("#about")) {
        gsap.from(".reveal-img", { 
            scrollTrigger: "#about", 
            scale: 0.9, opacity: 0, duration: 1 
        });

        // 6. Number Counter
        document.querySelectorAll('.counter').forEach(counter => {
            let zero = { val: 0 };
            let target = counter.getAttribute('data-target');
            gsap.to(zero, {
                val: target, duration: 2,
                scrollTrigger: { trigger: "#about", start: "top 70%" },
                onUpdate: function() { counter.innerText = Math.ceil(zero.val); }
            });
        });

        // Watermark
        gsap.to(".watermark-text", {
            xPercent: 20, 
            scrollTrigger: { trigger: "#about", start: "top bottom", end: "bottom top", scrub: 1 }
        });
    }
    /* ===================== ABOUT SECTION END (JS) ===================== */
}

// 7. Portfolio Filtering
document.addEventListener("DOMContentLoaded", function () {
    const filterBtns = document.querySelectorAll(".filter-btn[data-filter]");
    const loadMoreBtn = document.getElementById("loadMoreBtn");
    const portfolioItems = document.querySelectorAll(".portfolio-item");

    if (portfolioItems.length > 0) {
        const initialItems = 9; 
        const loadItems = 9;    
        let visibleCount = initialItems;
        let currentFilter = 'all';

        function updateVisibility() {
            let filteredItems = [];
            portfolioItems.forEach(item => {
                const category = item.getAttribute("data-category");
                item.style.display = ''; 
                if (currentFilter === 'all' || category === currentFilter) {
                    filteredItems.push(item);
                    item.classList.add("hidden"); 
                } else {
                    item.classList.add("hidden");
                }
            });

            filteredItems.forEach((item, index) => {
                if (index < visibleCount) {
                    item.classList.remove("hidden");
                    item.style.animation = 'fadeIn 0.5s ease-in-out';
                }
            });

            if (loadMoreBtn) {
                if (filteredItems.length <= initialItems) {
                    loadMoreBtn.style.display = 'none'; 
                } else {
                    loadMoreBtn.style.display = 'inline-block';
                    loadMoreBtn.innerText = visibleCount >= filteredItems.length ? "Show Less" : "Show More";
                }
            }
        }

        filterBtns.forEach(btn => {
            btn.addEventListener("click", function () {
                filterBtns.forEach(b => b.classList.remove("active"));
                this.classList.add("active");
                currentFilter = this.getAttribute("data-filter");
                visibleCount = initialItems; 
                updateVisibility();
            });
        });

        if(loadMoreBtn) {
            loadMoreBtn.addEventListener("click", function (e) {
                e.preventDefault();
                const totalFiltered = Array.from(portfolioItems).filter(item => {
                    const category = item.getAttribute("data-category");
                    return currentFilter === 'all' || category === currentFilter;
                }).length;

                if (visibleCount >= totalFiltered) {
                    visibleCount = initialItems;
                    const filters = document.querySelector('.portfolio-filters');
                    if(filters) filters.scrollIntoView({ behavior: 'smooth' });
                } else {
                    visibleCount += loadItems;
                }
                updateVisibility();
            });
        }
        updateVisibility();
    }
});

// 8. Intersection Observer for Skills
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('animate');
    });
}, { threshold: 0.1 });
document.querySelectorAll('.skill-card').forEach(card => observer.observe(card));

// 9. 3D Tilt Effect (Only for Desktop)
if (window.matchMedia("(hover: hover)").matches) {
    const cards = document.querySelectorAll('.market-card'); // Note: Only affects market-cards
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (y - centerY) / 10;
            const rotateY = (centerX - x) / 10;
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-10px)`;
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)`;
        });
    });
}

// 10. Swiper Initialization (OPTIMIZED)
document.addEventListener("DOMContentLoaded", function() {
    if(document.querySelector('.cert-swiper')) {
        const certificateSwiper = new Swiper('.cert-swiper', {
            slidesPerView: 1,
            spaceBetween: 25,
            loop: true,
            grabCursor: true,
            observer: true,       // Important for dynamic content
            observeParents: true, // Important if section was hidden
            autoplay: {
                delay: 4000,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
            },
            breakpoints: {
                640: { slidesPerView: 1, spaceBetween: 20 },
                768: { slidesPerView: 2, spaceBetween: 30 },
                1100: { slidesPerView: 3, spaceBetween: 30 }
            },
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
                dynamicBullets: true,
            },
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            },
            speed: 800,
            effect: 'slide'
        });
    }
});

// 11. PDF Modal Logic
const pdfUrl = "assets/imgs/Cyber-Security-And-Ethics-Latest-Trend.pdf";
function openPdfModal() {
    const modal = document.getElementById("pdfModal");
    const iframe = document.getElementById("pdfFrame");
    if(modal && iframe) {
        iframe.src = pdfUrl; 
        modal.style.display = "block";
        document.body.style.overflow = "hidden";
    }
}
function closePdfModal() {
    const modal = document.getElementById("pdfModal");
    const iframe = document.getElementById("pdfFrame");
    if(modal && iframe) {
        modal.style.display = "none";
        iframe.src = "";
        document.body.style.overflow = "auto";
    }
}
window.onclick = function(event) {
    const modal = document.getElementById("pdfModal");
    if (event.target == modal) { closePdfModal(); }
}


// Lazy-load PDF iframe when visible
const pdfFrames = document.querySelectorAll('.pdf-thumbnail');

const pdfObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const iframe = entry.target;
            if (!iframe.src) {
                iframe.src = iframe.dataset.src;
            }
            pdfObserver.unobserve(iframe);
        }
    });
}, { threshold: 0.2 });

pdfFrames.forEach(iframe => pdfObserver.observe(iframe));