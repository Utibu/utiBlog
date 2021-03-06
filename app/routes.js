module.exports = function(app, passport) {

	app.use(function (req, res, next) {

		var email = '';
		var superUrl = '';
		var blogName = 'utiBlog'

		if (req.user) {
			email = req.user.local.email;
			superUrl = req.user.local.url;
			blogName = req.user.local.blogName;
		}

	    res.locals = {
		    email : email,
		    superUrl : superUrl,
		    blogName : blogName,
	   	};
	   	next();
	});

	var api = require('../api/blog');

	app.param('blogUrl' , function(req, res, next, blogUrl) {
		req.blogUrl = blogUrl;
		next();
	});

	app.param('entryUrl' , function(req, res, next, entryUrl) {
		req.entryUrl = entryUrl;
		next();
	});

	app.param('act', function(req, res, next, act) {
		req.act = act;
		console.log('act: ' + req.act);
		next();
	});

	app.get('/', function(req, res) {
		
		if (req.user) {
			console.log('BLOG');
			return res.redirect('/blog/' + req.user.local.url);
		}
		console.log('Index');
		res.render('index', { title : 'Index' });
		
		
	});

		app.get('/createPost', isLoggedIn, function(req, res) {
		var msg = req.flash('createPostMessage');
		var content = '';

		console.log(req.session.content);

		if (req.session.content) {
			content = req.session.content;
			console.log(content.content);
		} else {
			content = '';
		}

		// TODO: Clear the content session when leaving createPost (maybe)?

		res.render('createPost.ejs', {
			user : req.user,
			title : 'Create post',
			message : msg,
			storedContent : content
		})
	});

	app.get('/blog/:url', function(req, res) {
		api.getEntries(req, res);
	});

	app.get('/blog/:blogUrl/:entryUrl/:act', function(req, res) {
		console.log('URL: ' + req.entryUrl);
		api.loadForm(req, res);
	});

	app.get('/blog/:blogUrl/:entryUrl', function(req, res) {
		api.getSingleEntry(req, res);
	});

	/*app.get('/:url', function(req, res) {
		api.getEntries(req, res);
	});*/

	app.post('/blog/:blogUrl/:entryUrl/:act', function(req, res) {
		switch (req.act) {
		case 'update':
			api.saveEntry(req, res);
			break;
		case 'delete':
			api.deleteEntry(req, res);
			break;
		case 'save':
			res.render('error', { errorMsg: 'Save' } );
			break;
		default:
			res.render('error', { errorMsg: 'There are no action called ' + req.action } );
			break;
	}
	});
	app.post('/createPost', api.newPost);

	app.get('/login', notLoggedIn, function(req, res) {
		var msg = req.flash('loginMessage');
		res.render('login', { message: msg });
	});

	app.post('/login', notLoggedIn, passport.authenticate('local-login', {
		successRedirect : '/administrate',
		failureRedirect : '/login',
		failureFlash : true
	}));

	app.get('/signup', notLoggedIn, function(req, res) {
		var msg = req.flash('signupMessage');
		res.render('signup.ejs', { 
			message : msg, 
			title : 'Signup',
			url : req.protocol + '://' + req.get('host')
		});
	});

	app.post('/signup', notLoggedIn, passport.authenticate('local-signup', {
		successRedirect : '/administrate',
		failureRedirect : '/signup',
		failureFlash : true
	}));

	app.get('/administrate', isLoggedIn, function(req, res) {
		res.render('administrate.ejs', {
			user : req.user,
			title : 'Administrate'
		});
	});

	app.get('/logout', function(req, res) {
		req.logout();
		res.redirect('/');
	});

	app.use(function(err, req, res, next) {
	  	console.error(err.stack);

	  	if (!req.isAuthenticated()) {
	  		res.render('error', { errorMsg : 'Please log in to continue.' });
	  	}

	  	res.status(500).render('error', { errorMsg : 'Something broke. 500 error.' });
	  	next();
	});

	app.use(function(req, res, next) {
	  	res.status(404).render('error', { errorMsg : 'Unfortunately it has just occured a 404 error, which means that the page you are looking for does not exist.' });
	});
};

function isLoggedIn(req, res, next) {
	if (req.isAuthenticated())
		return next()

	res.redirect('/');
}

function notLoggedIn(req, res, next) {
	if (!req.isAuthenticated())
		return next()

	res.redirect('/');
}