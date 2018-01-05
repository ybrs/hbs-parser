let a = `
<div class="post">
    {{#each items}}
      <h1>{{author}}</h1>
      {{#each others}}
        <h3>{{otheritem}}</h3>
      {{/each}}

      {{#each someitems}}
        <h5>{{someitem}}</h5>
        <ul>
        {{#each theothers}}
            <li>
                {{theothers_name}}
            </li>
        {{/each}}
        </ul>
      {{/each}}


      {{#if name }}
        <p>{{name}}</p>
      {{else}}
        <p> no name </p>
      {{/if}}
    {{/each}}
</div>
`

hbs = require('handlebars')


const strPad = (s, level, pad='      ')=>{
    let r = []
    for(let x=0; x<level; x++){
        r.push(pad)
    }
    return `${r.join('')}${s}`
}

class HBSParser {
    constructor(){
        this.level = 0;
        this.parseTemplate = this.parseTemplate.bind(this)
        this.parsePart = this.parsePart.bind(this)
        this.djangoTemplate = []
        this.contexts = []
        this.contextVariables = 'abcxyz'
        this.lastLevel = 0
        this.typeParsers = {
            'ContentStatement': (part, level, parseFn)=>{
                    this.djangoTemplate.push([level, part.type, part.value]); 
                    parseFn(part.program, level);
            },
            'BlockStatement': (part, level, parseFn)=>{
                // {#each }
                // this.contexts.push(this.contextVariables[level])
                this.djangoTemplate.push([level, part.type, part.path.parts[0], part.params[0].parts]); 
                parseFn(part.program, ++level); 
            },
            'Program': (part, level, parseFn)=> parseFn(part.body, level),
            'MustacheStatement': (part, level, parseFn)=>{
                    this.djangoTemplate.push([level, part.type, part.path.parts[0]]); 
            }
        }
    }

    translateHelpers(level, cmd, ...others){
        let contextVar = this.contextVariables[level]
        return {
            'each': (level, params)=> strPad(`{% for ${contextVar} in ${params} %}`, level) +'\n',
            'if': (level, params)=> strPad(`{% if ${params} %}`, level) +'\n',
        }[cmd](level, ...others)
    }

    translateStatement(level, type, ...others){
        let statements = {
            'ContentStatement': (level, s)=> s,
            'BlockStatement': (level, cmd, params)=> this.translateHelpers(level, cmd, ...params),
            'MustacheStatement': (level, params)=>{
                let contextVar = this.contextVariables[level-1]
                return `{{ ${contextVar}.${params} }}`
            }
        }

        return statements[type]? statements[type](level, ...others) : ''
    }


    parsePart(part, level){
        if (!part){
            return
        }

        if (Array.isArray(part)){
            for (const p of part){
                this.parsePart(p, level)
            }
            return
        }

        console.log("- level - ", level)
        console.log("---------------------------")
        console.log(part)
        console.log("//-------------------------")
    
        let fn = this.typeParsers[part.type]
        if (typeof fn === 'undefined'){
            console.error(part.type, "is undefined")
            console.log('---------------------')
            console.log(part)
            console.log("//-------------------")
            return
        }
        fn(part, level, this.parsePart)
        // this.parsePart(ret)
    }

    parseTemplate(s){
        this.template = s
        this.parsed = hbs.parse(a)
        this.parsePart(this.parsed.body, 0)

    }

    output(){
        let out = []
        console.log("-------")
        console.log(this.contexts)
        console.log("//-----")
        for (const line of this.djangoTemplate){
           console.log("| ", line)
            let level = line[0]
            if (level < this.lastLevel){
                // exiting from block
                out.push(strPad("{% endFor %}", level) + '\n')
            }
            this.lastLevel = level
            out.push(this.translateStatement(...line))
        }
        return out.join('')
    }

}

let p = new HBSParser()
p.parseTemplate(a)
console.log(p.output())



