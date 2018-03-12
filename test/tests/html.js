(()=>{
	const {html} = windex
	const html_element = html.create('div',{
		id:'html_test',
		html:`
<h1>HTML Test</h1>
<nav id="toolbar">
	<a href="#one">One</a>
	<a href="#two">Two</a>
	<a href="#three">Three</a>
	<a href="#four">Four</a>
</nav>
<section id="content">
	<header>
		<h2>Section</h2>
	</header>
	<article>
		<h3>Article</h3>
		<p>This is an article.</p>
	</article>
	<article id="html_test_results">
		<h3>Test results</h3>
		<ol>
		
		</ol>
	</article>
</section>
<footer>
	HTML &copy; Copyright Test
</footer>
		`,
		design:{
			padding:'20px'
		}
	})
	document.body.appendChild(html_element)

	const test = html(html_element)
	const results = test.gui.html_test_results
	const list = test.select('ol',results)

	//all
	add_result(`test.all('a')`,text_list(test.all('a')))

	//container
	add_result(`html.container => body`,html.container.localName)

	//elements
	add_result(`test.elements`,'\t•'+test.elements.map(e=>e.localName).join('\n•'))

	//select
	const article = html(test.select('article'))
	const content = test.select('#content')
	add_result(`article_html.select('header',content_element)`,article.select('h3',content).outerHTML)

	//select
	add_result(`test.select('p')`,test.select('p').outerHTML.trim())



	//shared actions
	function add_result(label,text){
		text = text.replace(/\</g,'&lt;')
		text = text.replace(/\>/g,'&gt;')
		const item = html.create('li',{html:`<div>
			<div>${label}</div>
<pre><code>${text.trim()}</code></pre>
		</div>`})

		list.appendChild(item)

	}
	function text_list(list){
		return list.map(e=>e.outerHTML).join('\n')
	}

})()