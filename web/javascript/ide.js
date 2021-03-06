/*
   Provide the XMLHttpRequest constructor for IE 5.x-6.x:
   Other browsers (including IE 7.x-8.x) do not redefine
   XMLHttpRequest if it already exists.

   This example is based on findings at:
   http://blogs.msdn.com/xmlteam/archive/2006/10/23/using-the-right-version-of-msxml-in-internet-explorer.aspx
*/
if (typeof XMLHttpRequest == "undefined") {
	XMLHttpRequest = function () {
		try { return new ActiveXObject("Msxml2.XMLHTTP.6.0"); }
			catch (e) {}
		try { return new ActiveXObject("Msxml2.XMLHTTP.3.0"); }
			catch (e) {}
		try { return new ActiveXObject("Msxml2.XMLHTTP"); }
			catch (e) {}
		//Microsoft.XMLHTTP points to Msxml2.XMLHTTP.3.0 and is redundant
		throw new Error("This browser does not support XMLHttpRequest.");
	};
}

var IDE_clone = function(object) {
	var newObj = (object instanceof Array) ? [] : {};
	for (var i in object) {
		if (i == 'clone') {
			continue;
		}
		if (object[i] && typeof object[i] == "object") {
			newObj[i] = IDE_clone(object[i]);
		} else {
			newObj[i] = object[i];
		}
	}
	return newObj;
};

var IDE_base = "control.php";
var IDE_async_count = 0;
var IDE_backend_debug = null;
showElement = hideElement = function(){};

IDE_notification_callback = function(note) {
	var object = createDOM('span');
	object.innerHTML = note + ' [<a href="javascript:status_click();">dismiss</a>]';
	status_rich_show(object, LEVEL_WARN);
};

function IDE_handle_backend_response(responseText, args, successCallback, errorCallback) {
	var rp = JSON.parse(responseText);
	if (rp.debug) {
		IDE_backend_debug = rp.debug;
	}
	if (rp.notifications) {
		forEach(rp.notifications, IDE_notification_callback);
	}
	if (rp.error) {
		errorCallback(rp.error[0], rp.error[1], args);
	} else {
		successCallback(rp, args);
	}
}

function IDE_backend_request(command, args, successCallback, errorCallback) {
	var rq = JSON.stringify(args);
	var xhr = new XMLHttpRequest();
	var cb = function() {
		if (xhr.readyState != 4) { return; }
		IDE_async_count--;
		if (IDE_async_count == 0) {
			hideElement('rotating-box');
		}
		if (xhr.status == 200) {
			if (xhr.getResponseHeader("Content-type") == "text/html") {
				// PHP fatal error
				errorCallback(-1, "fatal PHP error", args);
				return;
			}
			var rt = xhr.responseText;
			IDE_handle_backend_response(rt, args, successCallback, errorCallback);
		} else {
			errorCallback(-xhr.status, xhr.statusText, args);
		}
	};
	var ep = IDE_base + "/" + command;

	if (typeof(Piwik) == "object") {
		switch (command) {
			case 'file/put':
			case 'proj/co':
			case 'proj/commit':
				try {
					var piwikTracker = Piwik.getTracker(pkBaseURL + "piwik.php", 4);
					piwikTracker.setCustomVariable(1, "Team ID", team, "visit");
					piwikTracker.setCustomUrl(ep);
					piwikTracker.trackPageView();
				} catch( err ) {}
				break;
		}
	}

	xhr.open("POST", ep, true);
	xhr.onreadystatechange = cb;
	xhr.setRequestHeader("Content-type", "text/json");
	showElement('rotating-box');
	IDE_async_count++;
	xhr.send(rq);
}

function IDE_backend_request_with_retry(endpoint, args, success, retry_msg, fail) {
	var retry = function() {
		status_button(retry_msg, LEVEL_ERROR, "retry", function() {
			IDE_backend_request_with_retry(endpoint, args, success, retry_msg, fail);
		});
		if (fail) {
			fail();
		}
	};
	IDE_backend_request(endpoint, args, success, retry);
}

/// Shrink a (git) hashes to a common and more size for display
function IDE_hash_shrink(hash) {
	var hash_length = 9;
	if (hash == null) {
		return false;
	}
	if (hash.length < hash_length) {
		return hash;
	}
	return hash.substring(0, hash_length);
}

/// Compare (git) hashes of potentially unequal length
function IDE_hash_compare(a, b) {
	var min_hash_length = 6;
	if (a.length < min_hash_length || b.length < min_hash_length) {
		return false;
	}
	if (a == b) {
		return true;
	}
	var min_len = Math.min(a.length, b.length);
	var short_a = a.substring(0, min_len);
	var short_b = b.substring(0, min_len);
	return (short_a == short_b);
}

function IDE_path_get_project(path) {
	// index of '/' starting from char 1 onwards
	var idx = path.indexOf('/', 1);
	if (idx < 0) {
		return path;
	}
	// return a substring to that point
	return path.substring(1,idx);
}

function IDE_path_get_file(path) {
	// index of '/' starting from char 1 onwards
	var idx = path.indexOf('/', 1);
	if (idx < 0) {
		return path;
	}
	// return a substring from that point
	return path.substring(idx+1);
}

/// Is the given string null or whitespace
function IDE_string_empty(str) {
	return str == null || /^\s*$/.test(str);
}

// Extend string with an endsWith method.
if (typeof String.prototype.endsWith !== 'function') {
	String.prototype.endsWith = function(suffix) {
		return this.indexOf(suffix, this.length - suffix.length) !== -1;
	};
}

/**
 * Object which can be used to access common helper methods.
 * At the moment, this is just a plain wrapper on the above functions,
 * but can be used in classes that want to be unit-testable as it can be
 * mocked or injected.
 */
var Helpers = {
	'backend_request': IDE_backend_request,
	'backend_request_with_retry': IDE_backend_request_with_retry,
	'hash_shrink': IDE_hash_shrink,
	'hash_compare': IDE_hash_compare,
	'path_get_project': IDE_path_get_project,
	'path_get_file': IDE_path_get_file
};
