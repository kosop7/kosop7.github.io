---
layout: page
title: About
permalink: /about/
---

<img
  src="{{ '/assets/images/profile.jpg' | prepend: site.baseurl }}"
  alt="profile photo"
  style="max-width:300px;width:100%;display:block;margin:0 auto 40px;"
>

{% for i in (1..7) %}
<img
  src="{{ '/assets/images/photo (' | append: i | append: ').jpg' | prepend: site.baseurl }}"
  alt="photo {{ i }}"
  style="max-width:300px;width:100%;display:block;margin:24px auto;"
>
{% endfor %}
