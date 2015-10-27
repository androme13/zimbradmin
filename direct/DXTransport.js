/* 
 * DXTransport
 * (C) Androme 2015
 * 
 */
var log = global.log.child({widget_type: 'DXTransport'});
var pool = global.pool;
var DXCommon = require('../tools/DXCommon.js');
var DXTransport = {
    // method signature has 5 parameters
    /**
     *
     * @param params object with received parameters
     * @param callback callback function to call at the end of current method
     * @param sessionID - current session ID if "enableSessions" set to true, otherwise null
     * @param request only if "appendRequestResponseObjects" enabled
     * @param response only if "appendRequestResponseObjects" enabled
     */

    add: function (params, callback, sessionID, request, response) {
        // mono requete, à voir plus tard pour du multi-requete
        if (!params) {
            var params = [];
            params[0] = {};
        }
        params[0].table = 'transport';
        params[0].log = log;
        var myId = request.session.userinfo.id;
        var query = "INSERT INTO " + params[0].table;
        query += " (domain, transport, created_by) VALUES ('";
        query += params[0].domain.toLowerCase() + "','";
        query += params[0].transport.toLowerCase() + "','" + myId + "')";
        params[0].query = query;
        DXCommon.add(params[0], callback, sessionID, request, response);
    },
    destroy: function (params, callback, sessionID, request, response) {
        // multi requete
        if (!params) {
            var params = [];
            params[0] = {};
        }
        var newParams = {};
        newParams.table = 'transport';
        newParams.log = log;
        newParams.length = params.length;
        var occur = '';
        var temp = '';
        var count = 0;
        params.forEach(function (entry) {
            count++;
            // test erreur///
            //if (count == 2)
            // entry.domain = 'aa' + entry.domain;
            temp = "(" + entry.id + ",'";
            temp += entry.domain + "','";
            temp += entry.transport + "')";
            if (count < params.length)
            {
                temp += ',';
            }
            occur += temp;
        });
        var query = "DELETE FROM " + newParams.table + " WHERE (id,domain,transport) IN (" + occur + ")";
        newParams.query = query;
        DXCommon.destroy(newParams, callback, sessionID, request, response);
    },
    get: function (params, callback, sessionID, request, response) {
        // on set les parametres par défaut si ils sont absents
        if (!params)
            var params = {};
        params.extraQuery = '';
        params.table = 'transport';
        if (!params.col)
            params.col = 'domain';
        if (!params.start)
            params.start = 0;
        if (!params.limit)
            params.limit = 50;
        if (params.search) {
            params.extraQuery = " WHERE " + params.col;
            params.extraQuery += " LIKE '%" + params.search + "%'";
        }
        params.log = log;
        var query = "SELECT * FROM " + params.table + params.extraQuery;
        query += " LIMIT " + params.start + ',' + params.limit;
        params.query = query;
        DXCommon.get(params, callback, sessionID, request, response);
    },
    update: function (params, callback, sessionID, request, response) {
        // mono requete, à voir plus tard pour du multi-requete
        var myId = request.session.userinfo.id;
        // on set les parametres par défaut si ils sont absents
        if (!params) {
            var params = [];
            params[0] = {};
        }
        params[0].table = 'transport';
        params[0].log = log;
        var query = "UPDATE " + params[0].table + " SET domain='" + params[0].domain.toLowerCase();
        query += "', transport='" + params[0].transport.toLowerCase();
        query += "', modified_by='" + myId;
        query += "' WHERE id='" + params[0].id + "'";
        params[0].query = query;
        DXCommon.update(params, callback, sessionID, request, response);
    },
};

module.exports = DXTransport;