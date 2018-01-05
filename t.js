let a = `
    {{#if cond}}
        <p>cond is true</p>
    {{/if}}

    {{#unless cond}}
        <p>cond is false</p>
    {{/unless}}

    {{#if name }}
        xtrue
    {{else}}
        {{#each foo}}
            <div>{{foobar}}</div>
        {{/each}}

        {{#each bar}}
            <div>{{x}}</div>
        {{/each}}
    {{/if}}

{{#each paragraphs }}
  
    {{title}}

  <p>{{title}}</p>
{{else}}
  <p class="empty">No content</p>
{{/each}}


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
        this.blocks = []
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
                let l = level + 1;
                this.djangoTemplate.push([level, part.type, part.path.parts[0], part.params[0].parts]); 
                parseFn(part.program, l)
                // if conditional had if/else
                // each has inverse too {{ else }}
                if (part.inverse){
                    this.djangoTemplate.push([l, 'ELSE', part.path.parts[0]]); 
                    parseFn(part.inverse, l) 
                }

            },
            'Program': (part, level, parseFn)=> parseFn(part.body, level),
            'MustacheStatement': (part, level, parseFn)=>{
                    this.djangoTemplate.push([level, part.type, part.path.parts[0]]); 
            }
        }
    }

    translateHelpers(level, cmd, ...others){
        let contextVar = this.contextVariables[level]
        this.blocks.push(cmd)
        return {
            'each': (level, params)=> strPad(`{% for ${contextVar} in ${params} %}`, level) +'\n',
            'if': (level, params)=> strPad(`{% if ${params} %}`, level) +'\n',
            'unless': (level, params)=> strPad(`{% if not ${params} %}`, level) +'\n',
        }[cmd](level, ...others)
    }

    translateStatement(level, type, ...others){
        let statements = {
            'ContentStatement': (level, s)=> s,
            'BlockStatement': (level, cmd, params)=> this.translateHelpers(level, cmd, ...params),
            'MustacheStatement': (level, params)=>{
                let contextVar = this.contextVariables[level-1]
                return `{{ ${contextVar}.${params} }}`
            },
            'ELSE': (level, cmd)=>{
                if (cmd === 'each'){
                    return '{% empty %}\n'
                }
                return "{% else %}\n"
            }
        }
        console.log("type", type)
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

    getClosingTagForBlock(cmd){
        console.log("last block", cmd)
        return {
            'if': '{% endif %}',
            'each': '{% endfor %}',
            'unless': '{% endif %}'
        }[cmd]
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
                let lastBlock = this.blocks.pop()
                out.push(strPad(this.getClosingTagForBlock(lastBlock), level) + '\n')
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



