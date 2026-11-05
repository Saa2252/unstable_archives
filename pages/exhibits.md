---
layout: page
permalink: /exhibits/
title: Featured Exhibits
---

{% set exhibits = collections.exhibits %}
<ul>
  {% for exhibit in exhibits %}
    <li>
      <a href='{{ exhibit.url | absolute_url }}'>
        {{ exhibit.data.title }}
      </a>
    </li>
  {% endfor %}
</ul>
