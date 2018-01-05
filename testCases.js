let HBSParser = require('./hbsTranspiler').HBSParser
console.log(HBSParser)

let testCases = [
    ['if clause', `
{{#if cond}}
    hello
{{/if}}
    `,
    `
{% if cond %}
    hello
{% endif %}
`
    ],

    ['if else clause', `
{{#if cond}}
    hello
{{ else }}
    bar
{{/if}}
    `,
    `
{% if cond %}
    hello
{% else %}
    bar
{% endif %}
`
    ],

    ['each loops', 
    `
{{#each items}}
    {{title}}
{{/each}}
    `, 
    `
{% for a in items %}
    {{ a.title }}
{% endfor %}
    `],

    ['nested each loops', 
    `
{{#each items}}
    {{total}}
    {{#each others}}
        {{title}}
    {{/each}}    
{{/each}}
    `, 
    `
{% for a in items %}
    {{ a.total }}
      {% for b in others %}
        {{ b.title }}
      {% endfor %}
{% endfor %}
    `],

    ['nested if / each loops', 
    `
{{#if cond}}
    {{#each foobar}}
        {{total}}
    {{/each}}

    {{#each others}}
        {{title}}
    {{/each}}    
{{/if}}
    `, 
    `
{% if cond %}
      {% for b in foobar %}
        {{ b.total }}
      {% endfor %}

      {% for b in others %}
        {{ b.title }}
      {% endfor %}
{% endif %}
    `],

    ['nested each / if loops', 
    `
{{#each items}}
    {{#if cond}}
        {{total}}
    {{/if}}

    {{#each others}}
        {{title}}
    {{/each}}    
{{/each}}
    `, 
    `
{% for a in items %}
      {% if cond %}
        {{ a.total }}
      {% endif %}

      {% for b in others %}
        {{ b.title }}
      {% endfor %}
{% endfor %}
    `]

]

for (const testCase of testCases){
    console.log(testCase[0])
    let tp = new HBSParser()
    tp.parseTemplate(testCase[1])
    let out = tp.output()
    if (out.trim() == testCase[2].trim()){
        console.log("-> pass")
        // console.log(out.trim())

    } else {
            console.log("-----------")
            console.log("expected output was:")
            console.log(testCase[2].trim())
            console.log("actual output is")
            console.log(out.trim())
            console.log("//---------")
            console.log("FAILED")
    }
}