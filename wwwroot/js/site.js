// Global Site Scripts
// Notification logic is now handled in bildirimler.js

(function () {
    function getCsrfToken() {
        var tokenMeta = document.querySelector('meta[name="csrf-token"]');
        return tokenMeta ? tokenMeta.getAttribute('content') : '';
    }

    function isUnsafeMethod(method) {
        var normalized = (method || 'GET').toUpperCase();
        return normalized === 'POST' || normalized === 'PUT' || normalized === 'PATCH' || normalized === 'DELETE';
    }

    var token = getCsrfToken();

    if (window.jQuery && token) {
        $.ajaxSetup({
            beforeSend: function (xhr, settings) {
                if (isUnsafeMethod(settings && settings.type)) {
                    xhr.setRequestHeader('RequestVerificationToken', token);
                }
            }
        });
    }

    if (window.fetch && token) {
        var nativeFetch = window.fetch.bind(window);
        window.fetch = function (input, init) {
            var method = (init && init.method) || (input instanceof Request ? input.method : 'GET');
            if (!isUnsafeMethod(method)) {
                return nativeFetch(input, init);
            }

            if (input instanceof Request && !init) {
                var clonedHeaders = new Headers(input.headers || {});
                if (!clonedHeaders.has('RequestVerificationToken')) {
                    clonedHeaders.set('RequestVerificationToken', token);
                }

                var securedRequest = new Request(input, { headers: clonedHeaders });
                return nativeFetch(securedRequest);
            }

            var requestInit = Object.assign({}, init || {});
            var headers = new Headers(requestInit.headers || (input instanceof Request ? input.headers : {}));
            if (!headers.has('RequestVerificationToken')) {
                headers.set('RequestVerificationToken', token);
            }
            requestInit.headers = headers;

            return nativeFetch(input, requestInit);
        };
    }
})();
