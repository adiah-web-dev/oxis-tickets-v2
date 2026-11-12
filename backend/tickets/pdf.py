from io import BytesIO
from xml.sax.saxutils import escape

import qrcode

from django.utils import timezone

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Image,
    Table,
    TableStyle,
    HRFlowable,
)

def generate_ticket_pdf(ticket):
	buffer = BytesIO()

	document = SimpleDocTemplate(
		buffer,
		pagesize=letter,
		rightMargin=0.65 * inch,
		leftMargin=0.65 * inch,
		topMargin=0.5 * inch,
		bottomMargin=0.5 * inch,
		title=f'Ticket {ticket.ticket_code}',
		author='Oxbridge International School',
	)

	styles = getSampleStyleSheet()

	styles.add(ParagraphStyle(
		name='SchoolTitle',
		parent=styles['Title'],
		fontSize=20,
		leading=24,
		alignment=TA_CENTER,
		textColor=colors.HexColor('#172554'),
		spaceAfter=4,
	))

	styles.add(ParagraphStyle(
		name="EventTitle",
		parent=styles["Heading1"],
		fontSize=17,
		leading=21,
		alignment=TA_CENTER,
		textColor=colors.HexColor("#1E40AF"),
		spaceBefore=12,
		spaceAfter=12,
	))

	styles.add(ParagraphStyle(
		name="TicketCode",
		parent=styles["Heading2"],
		fontSize=13,
		alignment=TA_CENTER,
		textColor=colors.HexColor("#172554"),
	))

	styles.add(ParagraphStyle(
		name="SmallCenter",
		parent=styles["Normal"],
		alignment=TA_CENTER,
		fontSize=9,
		textColor=colors.HexColor("#64748B"),
	))

	order = ticket.order_item.order
	event = order.event
	ticket_type = ticket.order_item.ticket_type

	story = []

	# School heading

	story.append(Paragraph(
		"OXBRIDGE INTERNATIONAL SCHOOL",
		styles["SchoolTitle"]
	))

	story.append(Paragraph(
		"OFFICIAL EVENT TICKET",
		styles["SmallCenter"]
	))

	story.append(Spacer(1, 15))

	story.append(HRFlowable(
		width="100%",
		thickness=1,
		color=colors.HexColor("#CBD5E1")
	))

	# Event details
	story.append(Paragraph(
		escape(event.name),
		styles["EventTitle"]
	))

	event_date = timezone.localtime(event.start_date).strftime(
		"%A, %d %B %Y"
	)

	event_time = timezone.localtime(event.start_date).strftime(
		"%I:%M %p"
	)

	details = [
		["DATE", event_date],
		["TIME", event_time],
		["VENUE", event.venue],
		["TICKET TYPE", ticket_type.name],
		["PURCHASER", order.customer_name],
	]

	detail_table = Table(
		[
			[
				Paragraph(
					f"<b>{escape(str(label))}</b>",
					styles["Normal"]
				),
				Paragraph(
					escape(str(value)),
					styles["Normal"]
				),
			]
			for label, value in details
		],
		colWidths=[1.5 * inch, 4.5 * inch]
	)

	detail_table.setStyle(TableStyle([
		("BACKGROUND", (0, 0), (0, -1),
			colors.HexColor("#F1F5F9")),
		("TEXTCOLOR", (0, 0), (-1, -1),
			colors.HexColor("#1E293B")),
		("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
		("LEFTPADDING", (0, 0), (-1, -1), 10),
		("RIGHTPADDING", (0, 0), (-1, -1), 10),
		("TOPPADDING", (0, 0), (-1, -1), 10),
		("BOTTOMPADDING", (0, 0), (-1, -1), 10),
		("LINEBELOW", (0, 0), (-1, -1), 0.5,
			colors.HexColor("#CBD5E1")),
	]))

	story.append(detail_table)
	story.append(Spacer(1, 20))

	# Generate QR code in memory
	qr = qrcode.QRCode(
		version=None,
		error_correction=qrcode.constants.ERROR_CORRECT_M,
		box_size=10,
		border=4,
	)

	qr.add_data(ticket.ticket_code)
	qr.make(fit=True)

	qr_image = qr.make_image(
		fill_color="black",
		back_color="white"
	)

	qr_buffer = BytesIO()
	qr_image.save(qr_buffer, format="PNG")
	qr_buffer.seek(0)

	qr_flowable = Image(
		qr_buffer,
		width=1.8 * inch,
		height=1.8 * inch
	)

	story.append(qr_flowable)
	story.append(Spacer(1, 8))

	story.append(Paragraph(
		escape(ticket.ticket_code),
		styles["TicketCode"]
	))

	story.append(Spacer(1, 15))

	story.append(HRFlowable(
		width="100%",
		thickness=1,
		color=colors.HexColor("#CBD5E1")
	))

	story.append(Spacer(1, 10))

	story.append(Paragraph(
		"Please present this QR code at the entrance. "
		"Each ticket permits one entry only. "
		"Keep this ticket secure and do not share its QR code.",
		styles["SmallCenter"]
	))

	document.build(story)

	buffer.seek(0)
	return buffer
