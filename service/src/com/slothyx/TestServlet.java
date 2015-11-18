package com.slothyx;

import org.json.JSONException;
import org.json.JSONObject;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

public class TestServlet extends HttpServlet {

	@Override
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		try {
			JSONObject json = new JSONObject();
			json.put("url", request.getRequestURL());
			json.put("uri", request.getRequestURI());
			json.put("contextPath", request.getContextPath());
			writeJSONResponse(response, json.toString());
		} catch (JSONException ignored) {
			log("error", ignored);
		}
	}

	private void writeJSONResponse(HttpServletResponse response, String json) throws IOException {
		response.getWriter().println(json);
		response.setContentType("application/json");
	}
}
