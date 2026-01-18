---
layout: exhibit
title: 'Test Page for Gallery'
author: Max Johnson Dugan
publish_date: 2021-08-26
permalink: /gallery-test/
---
I'm using this page to see if the more sophisticated gallery displays in our Wax. As of August 26, 2021, it does not.

### Browse Collection

{% set galleryCollection = "unstable_archives" %}
{% set facet_by = "object_type" %}
{% include "collection_gallery.njk" %}
