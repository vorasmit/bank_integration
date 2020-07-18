frappe.provide('bi');

bi.listenForOtp = function (frm) {
	frappe.realtime.on("get_bank_otp", function(data){
		if (!frm || data.uid != frm._uid || frm.otp_requested) return;

		frm.otp_requested = true;
		frappe.hide_msgprint();

		let msg = '';
		if (data.mobile_no) {
			msg += `registered mobile number (<strong>${data.mobile_no}</strong>)`;
		}

		if (data.email_id) {
			if (msg) {
				msg += ' and ';
			} else {
				msg += 'registered ';
			}
			msg += `email address (<strong>${data.email_id}</strong>)`;
		}

		if (!msg) {
			msg = 'registered mobile number / email address';
		}

		var otp_dialog = frappe.prompt(
			{fieldtype: 'Data', label: 'One Time Password', fieldname: 'otp', reqd: 1,
			 description: `An OTP has been sent to your ${msg} for further authentication.`},
		function(_data){
			frappe.call({
				method: "bank_integration.bank_integration.api.continue_with_otp",
				args: {
					otp: _data.otp,
					bank_name: data.bank_name,
					uid: frm._uid,
					doctype: frm.doc.doctype,
					docname: frm.doc.name,
					resume_info: data.resume_info,
					data: data.data,
					logged_in: data.logged_in},
			});
			delete frm.otp_requested;
		}, 'Enter OTP');

		otp_dialog.set_secondary_action(function(){
			frappe.call({
				method: "bank_integration.bank_integration.api.cancel_session",
				args: {bank_name: data.bank_name, resume_info: data.resume_info, logged_in: data.logged_in}
			});
			delete frm._uid;
			delete frm.otp_requested;
		});
	});
}