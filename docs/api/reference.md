---
layout: page.njk
---
<article class="api">
{%- for item in api %}
{%- for i in item %}
{%- for j in i %}
{%- for k in j %}
{% if k.kind == 'function' %}
* {{ k.name }}
{% endif %}
{% endfor -%}
{% endfor -%}
{% endfor -%}
{% endfor -%}
</article>